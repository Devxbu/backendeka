const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const ApiError = require("../../../../shared/errors/apiError");
const rateLimiter = require("../../../../shared/utils/rateLimiter");
const authCacheService = require("./authCache.service");
const emailService = require("./email.service");
const companyService = require("../../../company/core/company.service");

const authRepository = require("../../infra/repositories/auth.repository");
const emailRepository = require("../../infra/repositories/email.repository");
const refreshRepository = require("../../infra/repositories/refresh.repository");

const parseDeviceType = require("../../../../utils/parseDeviceType");
const parseOS = require("../../../../utils/parseOS");
const parseBrowser = require("../../../../utils/parseBrowser");

class AuthService {
  async register({ email, password, companyName, ipAddress }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Rate Limiting
      const ipLimit = await rateLimiter.checkSlidingWindow(
        `ratelimit:register:ip:${ipAddress}`,
        3,
        3600, // 1 hour
      );
      if (!ipLimit.allowed) {
        throw new ApiError(
          429,
          "Too many registration attempts from this IP. Please try again later.",
        );
      }

      const emailLower = email.toLowerCase();
      const emailLimit = await rateLimiter.checkFixedWindow(
        `ratelimit:register:email:${emailLower}`,
        1,
        86400, // 24 hours
      );
      if (!emailLimit.allowed) {
        throw new ApiError(
          429,
          "Registration limit exceeded for this email. Please try again tomorrow.",
        );
      }

      // 2. Check if user exists
      const existingUser = await authRepository.findByEmail(emailLower);

      if (existingUser && existingUser.isEmailVerified) {
        throw new ApiError(409, "User already exists");
      }

      // Handle pending verification cleanup
      if (existingUser && !existingUser.isEmailVerified) {
        const ageMs = Date.now() - existingUser.createdAt.getTime();
        if (ageMs < 24 * 60 * 60 * 1000) {
          throw new ApiError(409, "Verification pending");
        }
        await authRepository.hardDeleteUser(existingUser.userId, session);
      }

      // 3. Create User & Token (Atomic)
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await authRepository.createUser(
        {
          email: emailLower,
          passwordHash: hashedPassword,
        },
        session,
      );

      await companyService.createProfile(user.userId, companyName);

      const emailToken = crypto.randomBytes(32).toString("hex");
      await emailRepository.create(
        {
          userId: user.userId,
          tokenType: "email_verification",
          tokenHash: crypto
            .createHash("sha256")
            .update(emailToken)
            .digest("hex"),
          email: user.email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        session,
      );

      await session.commitTransaction();

      // 4. Send Email (Side Effect - outside transaction)
      // If email fails, user exists but can't verify. They can request resend.
      // Ideally, we might want to schedule this via a queue or handle failure gracefully.
      try {
        await emailService.sendVerificationEmail(user.email, emailToken);
      } catch (err) {
        console.error("Failed to send verification email:", err);
        // Note: Failed emails do not block registration.
        // A user stuck unverified guarantees the 'login' resend flow can unblock them.
        // Queue/Broker architecture recommended for full reliability.
      }

      return {
        success: true,
        message:
          "Registration successful. Please check your email to verify your account.",
        data: {
          userId: user.userId,
          email: user.email,
          emailVerificationRequired: true,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof ApiError) throw error;
      console.error("REGISTER ERROR:", error);
      throw new ApiError(
        500,
        error.stack || error.message || "Internal server error",
      );
    } finally {
      session.endSession();
    }
  }

  async login({ email, password, ipAddress, userAgent }) {
    // 1. Rate Limiting
    const ipLimit = await rateLimiter.checkSlidingWindow(
      `ratelimit:login:ip:${ipAddress}`,
      10,
      900,
    );

    const emailLower = email.toLowerCase();
    const emailLimit = await rateLimiter.checkTokenBucket(
      `ratelimit:login:email:${emailLower}`,
      5,
      0.0055,
      900,
    );

    const globalLimit = await rateLimiter.checkFixedWindow(
      `ratelimit:login:global`,
      10000,
      60,
    );

    if (ipLimit.count > 5 || !ipLimit.allowed) {
      throw new ApiError(429, "Invalid credentials or too many attempts.");
    }
    if (!emailLimit.allowed || !globalLimit.allowed) {
      throw new ApiError(429, "Invalid credentials or too many attempts.");
    }

    // 2. Find User & Check Locks
    const user = await authRepository.findByEmail(emailLower);

    if (user) {
      const lockedTtl = await authCacheService.checkAccountLock(user.userId);
      if (lockedTtl) {
        throw new ApiError(
          429,
          "Account is temporarily locked due to multiple failed login attempts.",
        );
      }

      if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000);
        await authCacheService.setAccountLocked(user.userId, remainingTime);
        throw new ApiError(
          429,
          "Account is temporarily locked due to multiple failed login attempts.",
        );
      }
    }

    // 3. Verify Password
    const fakeHash =
      "$2b$12$C6UzMDM.H6dfI/f/IKcEeO6A6hZ6p9N1H8aCkT3P1l7KZ4p5J6N1K";
    const passwordHash = user ? user.passwordHash : fakeHash;
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      if (user) {
        const attempts = await authRepository.incrementFailedLoginAttempts(
          user.userId,
        );
        await authRepository.logLoginAttempt({
          identifier: emailLower,
          identifierType: "email",
          ipAddress,
          userAgent,
          successful: false,
          geolocation: null,
        });

        if (attempts >= 5) {
          let lockDuration = 0;
          if (attempts === 5) lockDuration = 15 * 60 * 1000;
          else if (attempts === 6) lockDuration = 30 * 60 * 1000;
          else if (attempts === 7) lockDuration = 60 * 60 * 1000;
          else if (attempts === 8) lockDuration = 6 * 60 * 60 * 1000;
          else lockDuration = 24 * 60 * 60 * 1000;

          const lockUntil = new Date(Date.now() + lockDuration);
          await authRepository.lockAccount(user.userId, lockUntil);
          await authCacheService.setAccountLocked(
            user.userId,
            lockDuration / 1000,
          );

          throw new ApiError(
            429,
            "Account is temporarily locked due to multiple failed login attempts.",
          );
        }
      }
      throw new ApiError(429, "Invalid credentials or too many attempts.");
    }

    // 4. Successful Login
    // Reset failures
    if (user) {
      await authRepository.resetFailedLoginAttempts(user.userId);
      await authRepository.logLoginAttempt({
        identifier: emailLower,
        identifierType: "email",
        ipAddress,
        userAgent,
        successful: true,
      });
    }

    if (user.accountStatus === "deleted") {
      throw new ApiError(403, "Invalid credentials or too many attempts.");
    }

    // Email Verification Check
    if (!user.isEmailVerified) {
      const canResend = await authCacheService.checkResendLimit(
        user.userId,
        300,
      );
      let message = "Please verify your email address before logging in.";

      if (canResend) {
        await emailRepository.invalidateUserTokens(user.userId);

        const emailToken = crypto.randomBytes(32).toString("hex");
        await emailRepository.create({
          userId: user.userId,
          tokenType: "email_verification",
          tokenHash: crypto
            .createHash("sha256")
            .update(emailToken)
            .digest("hex"),
          email: user.email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await emailService.sendVerificationEmail(user.email, emailToken);
        message =
          "Email not verified. A new verification email has been sent. Please check your inbox.";
      } else {
        message =
          "Email not verified. We recently sent you a verification email. Please check your inbox (including spam).";
      }

      return {
        error: "EMAIL_NOT_VERIFIED",
        message: message,
      };
    }

    const companyId = (await companyService.getProfileByAuthId(user.userId))
      ._id;
    // 5. Generate Tokens
    return this._generateTokensAndSession(
      user,
      companyId,
      ipAddress,
      userAgent,
    );
  }

  async refreshToken({ cmRefreshToken, ipAddress }) {
    try {
      const [tokenId, tokenSecret] = cmRefreshToken.split(".");
      if (!tokenId || !tokenSecret) throw new Error("Invalid refresh token");

      // Rate limit
      const refreshTokenLimit = await rateLimiter.checkTokenBucket(
        `ratelimit:refresh:${tokenId}`,
        10,
        0.1667,
        60,
      );
      if (!refreshTokenLimit.allowed) {
        throw new ApiError(429, "Too many requests");
      }

      // Lock
      const lockId = uuidv4();
      const lockKey = `lock:refresh:${tokenId}`;
      const hasLock = await authCacheService.acquireLock(lockKey, lockId, 5);

      if (!hasLock) {
        throw new ApiError(429, "Too many requests");
      }

      try {
        // Blacklist Check
        const isBlacklisted = await authCacheService.getBlacklistData(tokenId);
        if (isBlacklisted) {
          if (["rotation_attack", "rotation"].includes(isBlacklisted.reason)) {
            if (isBlacklisted.familyId) {
              // Security Alert: Revoke everything
              await this._handleSecurityViolation(
                isBlacklisted.familyId,
                isBlacklisted.userId,
                "Replay Attack",
              );
            }
            throw new ApiError(
              401,
              "Security violation detected. All sessions terminated",
            );
          }
          throw new ApiError(401, "Token has been revoked");
        }

        // Validate Token
        const tokenHash = crypto
          .createHash("sha256")
          .update(tokenSecret)
          .digest("hex");

        const refreshTokenDoc = await refreshRepository.findToken(
          tokenHash,
          tokenId,
        );

        if (!refreshTokenDoc) {
          throw new ApiError(401, "Invalid refresh token");
        }

        // Reuse Detection
        const wasTokenUsed = await refreshRepository.wasTokenUsed(tokenId);
        if (wasTokenUsed && Date.now() - wasTokenUsed.revokedAt < 60000) {
          await this._handleSecurityViolation(
            refreshTokenDoc.familyId,
            refreshTokenDoc.userId,
            "Replay Attack (DB)",
          );
          throw new ApiError(
            401,
            "Security violation detected. All sessions terminated",
          );
        }

        // Rotation & New Tokens
        const accessTokenId = uuidv4();
        const familyId = refreshTokenDoc.familyId;
        const refreshTokenId = uuidv4();

        const accessToken = jwt.sign(
          {
            tokenId: accessTokenId,
            userId: refreshTokenDoc.userId,
            email: refreshTokenDoc.email,
            roles: refreshTokenDoc.roles,
            permissions: refreshTokenDoc.permissions,
            familyId,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "15m",
            issuer: "auth",
            audience: "users",
          },
        );

        const refreshTokenSecret = crypto.randomBytes(32).toString("hex");
        const newRefreshToken = `${refreshTokenId}.${refreshTokenSecret}`;
        const refreshTokenHash = crypto
          .createHash("sha256")
          .update(refreshTokenSecret)
          .digest("hex");

        // Atomic token rotation using MongoDB Transactions
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          await refreshRepository.revokeToken(tokenId, "rotation", session);

          await refreshRepository.create(
            {
              tokenId: refreshTokenId,
              userId: refreshTokenDoc.userId,
              tokenHash: refreshTokenHash,
              familyId: refreshTokenDoc.familyId,
              previousTokenId: tokenId,
              deviceInfo: refreshTokenDoc.deviceInfo,
              ipAddress,
              geolocation: null,
              lastUsedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            session,
          );

          await session.commitTransaction();
        } catch (txnError) {
          await session.abortTransaction();
          throw txnError;
        } finally {
          session.endSession();
        }

        // Apply Redis state *after* MongoDB definitively commits
        await authCacheService.blacklistRefreshToken(tokenId, {
          reason: "rotation",
          userId: refreshTokenDoc.userId,
          familyId: refreshTokenDoc.familyId,
        });

        const sessionData = {
          userId: refreshTokenDoc.userId,
          email: refreshTokenDoc.email,
          roles: refreshTokenDoc.roles,
          permissions: refreshTokenDoc.permissions,
          familyId: refreshTokenDoc.familyId,
          deviceInfo: refreshTokenDoc.deviceInfo,
          ipAddress,
        };

        await authCacheService.setAccessToken(accessTokenId, sessionData);

        return {
          message: "Refresh token successful",
          accessToken,
          refreshToken: newRefreshToken,
          tokenType: "Bearer",
          user: {
            userId: refreshTokenDoc.userId,
            email: refreshTokenDoc.email,
            roles: refreshTokenDoc.roles,
            permissions: refreshTokenDoc.permissions,
          },
        };
      } finally {
        await authCacheService.releaseLock(lockKey, lockId);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error("REFRESH ERROR:", error);
      throw new ApiError(500, "Internal server error");
    }
  }

  async logout({ accessTokenId, refreshTokenId }) {
    // 1. Check access token session
    const sessionData = await authCacheService.getAccessToken(accessTokenId);

    // 2. Check refresh token in DB
    // Optimization: Don't read DB if we don't have to, but we need to verify ownership
    const token =
      await refreshRepository.findByIdIncludeRevoked(refreshTokenId);

    if (!token) throw new ApiError(401, "Invalid refresh token");

    // Idempotency
    if (token.isRevoked || !sessionData) {
      return { message: "Already logged out" };
    }

    if (token.userId !== sessionData.userId)
      throw new ApiError(403, "Invalid refresh token");
    if (token.familyId !== sessionData.familyId)
      throw new ApiError(403, "Invalid refresh token");

    await refreshRepository.revokeToken(refreshTokenId, "user_logout");

    await authCacheService.blacklistRefreshToken(refreshTokenId, {
      reason: "user_logout",
      userId: sessionData.userId,
      familyId: sessionData.familyId,
    });

    await authCacheService.revokeAccessToken(accessTokenId);

    return {
      message: "Logged out successfully",
    };
  }

  async logoutAll(userId) {
    const tokenIds = await refreshRepository.getRefreshTokensByUserId(userId);
    await refreshRepository.revokeAllTokens(userId);

    if (tokenIds.length > 0) {
      await authCacheService.blacklistAllRefreshTokens(tokenIds, userId);
    }
    await authCacheService.revokeAllUserSessions(userId);

    return {
      message: "Logged out from all devices",
    };
  }

  async forgotPassword({ email, ipAddress }) {
    // Rate limits
    const ipLimit = await rateLimiter.checkSlidingWindow(
      `ratelimit:forgotPass:ip:${ipAddress}`,
      10,
      3600,
    );
    if (!ipLimit.allowed)
      throw new ApiError(429, "Too many requests. Please try again later.");

    const emailLimit = await rateLimiter.checkFixedWindow(
      `ratelimit:forgotPass:email:${email}`,
      3,
      3600,
    );
    if (!emailLimit.allowed)
      throw new ApiError(429, "Too many requests. Please try again later.");

    const user = await authRepository.findByEmail(email.toLowerCase());
    if (!user) {
      // Security: Always return success to prevent email enumeration
      return { message: "Password reset email sent successfully" };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await emailRepository.invalidateUserPasswordTokens(user.userId, session);

      const tokenSecret = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(tokenSecret)
        .digest("hex");

      await emailRepository.create(
        {
          userId: user.userId,
          tokenType: "password_reset",
          tokenHash,
          email: user.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
        session,
      );

      await session.commitTransaction();

      try {
        await emailService.sendForgotPasswordEmail(user.email, tokenSecret);
      } catch (e) {
        console.error("Failed to send forgot password email", e);
      }

      return {
        message: "Password reset email sent successfully",
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async resetPassword({ token, password, ipAddress }) {
    // Rate limit
    const ipLimit = await rateLimiter.checkSlidingWindow(
      `ratelimit:resetPass:ip:${ipAddress}`,
      10,
      3600,
    );
    if (!ipLimit.allowed) throw new ApiError(429, "Too many requests.");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokensUser =
      await emailRepository.findUserWithPasswordResetToken(tokenHash);

    if (!tokensUser) throw new ApiError(400, "Invalid or expired token");
    if (tokensUser.expiresAt < new Date())
      throw new ApiError(400, "Token expired");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await authRepository.findById(tokensUser.userId, session);
      if (!user || user.deletedAt !== null || user.accountStatus !== "active")
        throw new ApiError(400, "User not found");

      const newPasswordHash = await bcrypt.hash(password, 12);
      await authRepository.updatePassword(
        user.userId,
        newPasswordHash,
        session,
      );

      await emailRepository.makeTokenUsed(tokensUser.tokenId, session);

      await session.commitTransaction();

      // Logout all sessions after password reset
      await this.logoutAll(user.userId);

      return {
        message: "Password reset successfully",
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async changePassword({ authId, oldPassword, newPassword }) {
    const user = await authRepository.findById(authId);
    if (!user) throw new ApiError(404, "User not found");
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) throw new ApiError(400, "Invalid old password");
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updatePassword(authId, newPasswordHash);
    return { message: "Password changed successfully" };
  }

  async verifyEmail({ token }) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const verificationToken =
      await emailRepository.findUserWithEmailVerificationToken(tokenHash);

    if (!verificationToken) throw new ApiError(400, "Invalid token");
    if (verificationToken.expiresAt < new Date())
      throw new ApiError(400, "Token expired");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await authRepository.findById(
        verificationToken.userId,
        session,
      );
      if (!user || user.deletedAt !== null)
        throw new ApiError(400, "User not found");
      if (user.isEmailVerified)
        throw new ApiError(400, "Email already verified");

      await authRepository.updateEmailVerification(user.userId, session);
      await emailRepository.makeTokenUsed(verificationToken.tokenId, session);

      await session.commitTransaction();

      await authCacheService.invalidateUserCache(user.userId);

      return {
        message: "Email verified successfully",
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  async _generateTokensAndSession(user, companyId, ipAddress, userAgent) {
    const accessTokenId = uuidv4();
    const familyId = uuidv4();
    const refreshTokenId = uuidv4();

    const accessToken = jwt.sign(
      {
        tokenId: accessTokenId,
        companyId: companyId,
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        familyId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
        issuer: "auth",
        audience: "users",
      },
    );

    const refreshTokenSecret = crypto.randomBytes(32).toString("hex");
    const refreshToken = `${refreshTokenId}.${refreshTokenSecret}`;
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenSecret)
      .digest("hex");

    await refreshRepository.create({
      tokenId: refreshTokenId,
      companyId: companyId,
      userId: user.userId,
      tokenHash: refreshTokenHash,
      familyId,
      deviceInfo: {
        userAgent,
        deviceType: parseDeviceType(userAgent),
        os: parseOS(userAgent),
        browser: parseBrowser(userAgent),
      },
      ipAddress,
      geolocation: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 900; // 15 mins

    const sessionData = {
      userId: user.userId,
      companyId: companyId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      familyId: familyId,
      deviceInfo: {
        userAgent,
        deviceType: parseDeviceType(userAgent),
        os: parseOS(userAgent),
        browser: parseBrowser(userAgent),
      },
      ipAddress,
      issuedAt,
      expiresAt,
    };

    await authCacheService.setAccessToken(accessTokenId, sessionData);

    await authRepository.updateOne(user.userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      lastLoginDevice: parseDeviceType(userAgent),
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresAt,
      user: {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  async _handleSecurityViolation(familyId, userId, reason) {
    await authCacheService.revokeAllFamily(familyId, userId);
    await authCacheService.blacklistAccessToken(familyId);

    const familyTokens = await refreshRepository.findTokensByFamilyId(familyId);
    for (const token of familyTokens) {
      await authCacheService.blacklistRefreshToken(token.tokenId, {
        reason: "rotation_attack",
        userId: token.userId,
        familyId: token.familyId,
      });
    }

    await emailService.sendSecurityAlert(
      userId,
      `Suspicious activity detected: ${reason}. All sessions have been terminated`,
    );
  }
}

module.exports = new AuthService();
