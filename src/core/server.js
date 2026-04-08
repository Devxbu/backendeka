const http = require("http");
const { createApp } = require("./app");
const env = require("../config/env");
const { connectDB } = require("../config/db");
const loggers = require("../shared/utils/logger");
const { initializeSocket } = require("./socket");

const bootstrap = async () => {
  const app = createApp();
  const httpServer = http.createServer(app);

  initializeSocket(httpServer);

  await connectDB();
  httpServer.listen(env.PORT, () => {
    loggers.generalLogger.info(`Server running on port ${env.PORT}`);
  });

  process.on("uncaughtException", (err) => {
    loggers.generalLogger.error("UNCAUGHT EXCEPTION! Shutting down...");
    loggers.generalLogger.error(err.name, err.message, err.stack);
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    loggers.generalLogger.error("UNHANDLED REJECTION! Shutting down...");
    loggers.generalLogger.error(err.name, err.message, err.stack);
    httpServer.close(() => {
      process.exit(1);
    });
  });
};

bootstrap();
