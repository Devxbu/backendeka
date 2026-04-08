const redisClient = require("./redis.client");

class CacheService {
  constructor() {
    this.client = redisClient;
    this.defaultTTL = 3600; // 1 hour default
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache Get Error [${key}]:`, error);
      return null; // Fail silently
    }
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Seconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (error) {
      console.error(`Cache Set Error [${key}]:`, error);
      // Fail silently
    }
  }

  /**
   * Delete value from cache
   * @param {string} key
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache Del Error [${key}]:`, error);
    }
  }

  /**
   * Delete keys matching a pattern
   * @param {string} pattern
   * @returns {Promise<void>}
   */
  async invalidatePattern(pattern) {
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on("data", async (keys) => {
        if (keys.length) {
          const pipeline = this.client.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      });

      stream.on("end", () => {
        // console.log(`Cache invalidated for pattern: ${pattern}`);
      });
    } catch (error) {
      console.error(`Cache Invalidate Pattern Error [${pattern}]:`, error);
    }
  }

  /**
   * Higher-Order Function to fetch from cache or execute fallback
   * @param {string} key
   * @param {function} fetcher
   * @param {number} ttl
   * @returns {Promise<any>}
   */
  async withCache(key, fetcher, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) return cached;
    
    const freshData = await fetcher();
    if (freshData !== undefined && freshData !== null) {
      await this.set(key, freshData, ttl);
    }
    return freshData;
  }
}

module.exports = new CacheService();
