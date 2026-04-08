const User = require("../../core/models/user.model");

class AuthRepository {
  async createUser(data, session = null) {
    return await User.create([data], { session }).then((res) => res[0]);
  }

  async findByEmail(email, session = null) {
    return await User.findOne({ email, deletedAt: null }).session(session);
  }

  async logLoginAttempt(data, session = null) {
    const LoginAttempt = require("../../core/models/loginAttempt.model");
    return await LoginAttempt.create([data], { session }).then((res) => res[0]);
  }

  async hardDeleteUser(userId, session = null) {
    return await User.findOneAndDelete({ userId }).session(session);
  }

  async lockAccount(userId, lockUntil, session = null) {
    return await User.updateOne(
      { userId },
      {
        $set: {
          lockUntil,
          //failedLoginAttempts: 0,
        },
      },
      { session },
    );
  }

  async incrementFailedLoginAttempts(userId, session = null) {
    const updated = await User.findOneAndUpdate(
      { userId },
      {
        $inc: { failedLoginAttempts: 1 },
        $set: { lastFailedLoginAt: new Date() },
      },
      { new: true, session },
    ).session(session);
    return updated.failedLoginAttempts;
  }

  async resetFailedLoginAttempts(userId, session = null) {
    return await User.updateOne(
      { userId },
      {
        $set: {
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      },
      { session },
    );
  }

  async findById(id, session = null) {
    return await User.findOne({ userId: id }).session(session);
  }

  async updateOne(userId, data, session = null) {
    return await User.updateOne({ userId }, data).session(session);
  }

  async updateEmailVerification(userId, session = null) {
    return await User.updateOne(
      { userId },
      { $set: { isEmailVerified: true } },
      { session },
    );
  }

  async updatePassword(userId, hash, session = null) {
    return await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          passwordHash: hash,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      },
      { session },
    ).session(session);
  }
}

module.exports = new AuthRepository();
