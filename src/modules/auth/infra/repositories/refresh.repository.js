const RefreshToken = require("../../core/models/refreshToken.model");

class RefreshRepository {
  async create(data, session = null) {
    return await RefreshToken.create([data], { session }).then((res) => res[0]);
  }
  async findToken(tokenHash, tokenId) {
    return await RefreshToken.findOne({
      tokenHash,
      tokenId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }
  async findTokenById(tokenId) {
    return await RefreshToken.findOne({
      tokenId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }

  // New method to find token even if revoked (for idempotent logout)
  async findByIdIncludeRevoked(tokenId) {
    return await RefreshToken.findOne({
      tokenId,
    });
  }
  async wasTokenUsed(tokenId) {
    return await RefreshToken.findOne({
      tokenId,
      isRevoked: true,
      revokedReason: "rotation",
    });
  }
  async findTokensByFamilyId(familyId) {
    return await RefreshToken.find({ familyId });
  }
  async revokeAllFamily(familyId, session = null) {
    return await RefreshToken.updateMany(
      { familyId },
      {
        $set: {
          isRevoked: true,
          revokedReason: "rotation_attack",
          revokedAt: new Date(),
        },
      },
    ).session(session);
  }
  async revokeToken(tokenId, reason, session = null) {
    return await RefreshToken.updateOne(
      { tokenId },
      {
        $set: {
          isRevoked: true,
          revokedReason: reason,
          revokedAt: new Date(),
        },
      },
    ).session(session);
  }
  async revokeAllTokens(userId, session = null) {
    return await RefreshToken.updateMany(
      { userId, isRevoked: false, expiresAt: { $gt: new Date() } },
      {
        $set: {
          isRevoked: true,
          revokedReason: "logout_all_devices",
          revokedAt: new Date(),
        },
      },
    ).session(session);
  }
  async getRefreshTokensByUserId(userId) {
    const refreshTokens = await RefreshToken.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    const tokenIds = refreshTokens.map((t) => t.tokenId);
    return tokenIds;
  }
}

module.exports = new RefreshRepository();
