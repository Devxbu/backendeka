const redis = require("../config/redis");
const loggers = require("../shared/utils/logger");
const ApiError = require("../shared/errors/apiError");

/**
 * Enhanced Rate Limiter Middleware
 * @param {Object} options
 * @param {number} options.window - Window in seconds
 * @param {number} options.limit - Max requests per window
 * @param {string} options.keyPrefix - Prefix for Redis key (allows per-route limiting)
 */
function rateLimiter({ window = 60, limit = 100, keyPrefix = "global" } = {}) {
  return async (req, res, next) => {
    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const key = `ratelimit:${keyPrefix}:${ip}`;

      const requests = await redis.incr(key);

      if (requests === 1) {
        await redis.expire(key, window);
      }

      if (requests > limit) {
        const ttl = await redis.ttl(key);
        return next(
          new ApiError(
            429,
            `Too many requests. Please try again in ${ttl} seconds.`,
          ),
        );
      }

      next();
    } catch (err) {
      loggers.generalLogger.error(`[RateLimiter:${keyPrefix}] Error:`, err);
      // Fail open to avoid blocking users if Redis is down, but log the error
      next();
    }
  };
}

module.exports = rateLimiter;
