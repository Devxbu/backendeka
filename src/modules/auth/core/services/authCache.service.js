const redisClient = require("../../../../config/redis");

class AuthCacheService {
  constructor() {
    this.EXPIRE_ACCESS_TOKEN = 900; // 15 mins
    this.EXPIRE_REFRESH_BLACKLIST = 604800; // 7 days
    this.EXPIRE_ACCESS_BLACKLIST = 900; // 15 min
    this.EXPIRE_USER_CACHE = 300; // 5 mins
    this.EXPIRE_LOCK = 5; // 5 seconds
  }

  // ==========================================
  // 1. Access Token Storage (Stateful JWT)
  // ==========================================

  async setAccessToken(tokenId, userData) {
    const key = `auth:access:${tokenId}`;
    const pipeline = redisClient.pipeline();

    pipeline.set(key, JSON.stringify(userData), "EX", this.EXPIRE_ACCESS_TOKEN);

    const userSessionsKey = `auth:user:sessions:${userData.userId}`;
    pipeline.sadd(userSessionsKey, tokenId);
    pipeline.expire(userSessionsKey, this.EXPIRE_ACCESS_TOKEN);

    await pipeline.exec();
  }

  async getAccessToken(tokenId) {
    const data = await redisClient.get(`auth:access:${tokenId}`);
    return data ? JSON.parse(data) : null;
  }

  async revokeAccessToken(tokenId) {
    const data = await this.getAccessToken(tokenId);
    if (!data) return;

    const pipeline = redisClient.pipeline();
    pipeline.del(`auth:access:${tokenId}`);
    if (data.userId) {
      pipeline.srem(`auth:user:sessions:${data.userId}`, tokenId);
    }
    await pipeline.exec();
  }

  async getUserSessions(userId) {
    const userSessionsKey = `auth:user:sessions:${userId}`;
    return await redisClient.smembers(userSessionsKey);
  }

  async revokeAllUserSessions(userId) {
    const userSessionsKey = `auth:user:sessions:${userId}`;
    const tokens = await redisClient.smembers(userSessionsKey);

    if (tokens.length === 0) return;

    const pipeline = redisClient.pipeline();
    tokens.forEach((tokenId) => {
      pipeline.del(`auth:access:${tokenId}`);
    });
    pipeline.del(`auth:user:${userId}`);
    pipeline.del(userSessionsKey);

    await pipeline.exec();
  }

  // ==========================================
  // 2. Refresh Token Blacklist
  // ==========================================

  async blacklistAllRefreshTokens(tokenIds, userId) {
    const pipeline = redisClient.pipeline();
    for (const tokenId of tokenIds) {
      pipeline.set(
        `auth:blacklist:refresh:${tokenId}`,
        JSON.stringify({
          userId: userId,
          revokedAt: Date.now(),
          reason: "logout_all_devices",
        }),
        "EX",
        this.EXPIRE_REFRESH_BLACKLIST,
      );
    }
    await pipeline.exec();
  }

  async blacklistRefreshToken(tokenId, meta) {
    // meta: { reason, familyId, userId? }
    const key = `auth:blacklist:refresh:${tokenId}`;
    await redisClient.set(
      key,
      JSON.stringify(meta),
      "EX",
      this.EXPIRE_REFRESH_BLACKLIST,
    );
  }
  async blacklistAccessToken(familyId) {
    const key = `auth:blacklist:access:${familyId}`;
    await redisClient.set(key, "1", "EX", this.EXPIRE_ACCESS_BLACKLIST);
  }

  async isRefreshTokenBlacklisted(tokenId) {
    const exists = await redisClient.exists(
      `auth:blacklist:refresh:${tokenId}`,
    );
    return exists === 1;
  }

  async getBlacklistData(tokenId) {
    const data = await redisClient.get(`auth:blacklist:refresh:${tokenId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  // ==========================================
  // 3. Account Locking & Failure Limits
  // ==========================================

  async setAccountLocked(userId, durationSeconds) {
    const key = `auth:locked:${userId}`;
    await redisClient.set(key, "1", "EX", durationSeconds);
  }

  async checkAccountLock(userId) {
    const key = `auth:locked:${userId}`;
    const ttl = await redisClient.ttl(key);
    return ttl > 0 ? ttl : null;
  }

  async incrementLoginFailures(email, windowSeconds = 900) {
    const key = `failures:login:${email}`;
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    return current;
  }

  async resetLoginFailures(email) {
    const key = `failures:login:${email}`;
    await redisClient.del(key);
  }

  async checkResendLimit(userId, windowSeconds = 300) {
    const key = `ratelimit:resend:${userId}`;
    const result = await redisClient.set(key, "1", "NX", "EX", windowSeconds);
    return result === "OK";
  }

  // ==========================================
  // 4. Session State Cache (User Object)
  // ==========================================

  async cacheUser(userId, userData) {
    const key = `auth:user:${userId}`;
    await redisClient.set(
      key,
      JSON.stringify(userData),
      "EX",
      this.EXPIRE_USER_CACHE,
    );
  }

  async getCachedUser(userId) {
    const data = await redisClient.get(`auth:user:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async invalidateUserCache(userId) {
    await redisClient.del(`auth:user:${userId}`);
  }

  // ==========================================
  // 5. Distributed Locks (Simple)
  // ==========================================

  async acquireLock(lockKey, lockId, ttl = this.EXPIRE_LOCK) {
    const result = await redisClient.set(lockKey, lockId, "NX", "EX", ttl);
    return result === "OK";
  }

  async releaseLock(lockKey, lockId) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redisClient.eval(script, 1, lockKey, lockId);
  }

  async revokeAllFamily(familyId, userId) {
    if (!userId) return;

    const userSessionsKey = `auth:user:sessions:${userId}`;
    const tokens = await redisClient.smembers(userSessionsKey);

    if (tokens.length === 0) return;

    // Optimization: fetch all tokens in parallel
    const tokenDataList = await Promise.all(
      tokens.map(async (tid) => {
        const data = await this.getAccessToken(tid);
        return { tid, data };
      }),
    );

    const deletePipeline = redisClient.pipeline();
    let deletions = 0;

    tokenDataList.forEach(({ tid, data }) => {
      if (data && data.familyId === familyId) {
        deletePipeline.del(`auth:access:${tid}`);
        deletePipeline.srem(userSessionsKey, tid);
        deletions++;
      } else if (!data) {
        // Clean up orphan token ID from set
        deletePipeline.srem(userSessionsKey, tid);
        deletions++;
      }
    });

    if (deletions > 0) {
      await deletePipeline.exec();
    }
  }
}

module.exports = new AuthCacheService();
