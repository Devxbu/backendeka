const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const router = require("../routes/index");
const rateLimiter = require("../middlewares/rateLimiter");
const ApiError = require("../shared/errors/apiError");
const { errorHandler } = require("../shared/middlewares/error.middleware");

module.exports.createApp = () => {
  const app = express();

  const { generalLogger } = require("../shared/utils/logger");

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(
    morgan("combined", {
      stream: { write: (message) => generalLogger.info(message.trim()) },
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  app.use(rateLimiter({ window: 60, limit: 50 }));
  app.use("/api", router);

  app.use((req, res, next) => {
    next(new ApiError(404, "Not found"));
  });

  app.use(errorHandler);

  return app;
};
