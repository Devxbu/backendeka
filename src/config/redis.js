const logger = require("../shared/utils/logger");
const Redis = require("ioredis");
const env = require("./env");

const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,

  // Connection pooling & resilience
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false, // Fail fast

  // Performance tuning
  connectTimeout: 10000,
  lazyConnect: false,
  keepAlive: 30000,

  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redisClient.on("error", (err) => {
  logger.generalLogger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.generalLogger.info("Redis Client Connected");
});

module.exports = redisClient;
