const Email = require("../../core/models/emailVerificationToken.model");

class EmailRepository {
  async create(data, session = null) {
    return await Email.create([data], { session }).then((res) => res[0]);
  }

  async invalidateUserTokens(userId, session = null) {
    return await Email.updateMany(
      { userId, tokenType: "email_verification", isUsed: false },
      { $set: { isUsed: true, usedAt: new Date() } },
    ).session(session);
  }

  async findUserWithEmailVerificationToken(token) {
    return await Email.findOne({
      tokenHash: token,
      tokenType: "email_verification",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
  }
  async findUserWithPasswordResetToken(token) {
    return await Email.findOne({
      tokenHash: token,
      tokenType: "password_reset",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async makeTokenUsed(tokenId, session = null) {
    return await Email.updateOne(
      { tokenId: tokenId },
      { $set: { isUsed: true, usedAt: new Date() } },
    ).session(session);
  }

  async invalidateUserPasswordTokens(userId, session = null) {
    return await Email.updateMany(
      { userId, tokenType: "password_reset", isUsed: false },
      { $set: { isUsed: true, usedAt: new Date() } },
    ).session(session);
  }
}

module.exports = new EmailRepository();
