const mongoose = require("mongoose");
const env = require("./env");
const loggers = require("../shared/utils/logger");

module.exports.connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    loggers.generalLogger.info("MongoDB connected");
  } catch (error) {
    loggers.generalLogger.error(error);
    process.exit(1);
  }
};
