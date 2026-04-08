const env = require("../../config/env");
const { generalLogger } = require("../utils/logger");
const ApiError = require("../errors/apiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle non-ApiError instances
  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";

    // Convert Mongoose/Joi or other errors if needed
    if (err.name === "ValidationError") statusCode = 400;
    if (err.isJoi) statusCode = 400;
  }

  // Ensure message isn't leaked in production if not intentional
  if (env.NODE_ENV === "production" && !err.isOperational) {
    statusCode = 500;
    message = "Internal Server Error";
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    code: statusCode,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (env.NODE_ENV === "development" || statusCode >= 500) {
    generalLogger.error(err);
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
