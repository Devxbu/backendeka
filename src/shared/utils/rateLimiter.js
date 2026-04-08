const redisClient = require("../../config/redis");

class RateLimiter {
  /**
   * Sliding Window Rate Limiter (Fixed Window)
   * Suitable for strict limits like "10 requests per minute"
   * @param {string} key - Redis key
   * @param {number} limit - Max requests
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Promise<{allowed: boolean, count: number}>}
   */
  async checkSlidingWindow(key, limit, windowSeconds) {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await redisClient.zremrangebyscore(key, 0, windowStart);

    // Get current count
    const count = await redisClient.zcard(key);

    if (count < limit) {
      const member = `${now}:${Math.random().toString(36).substr(2, 9)}`;

      const pipeline = redisClient.pipeline();
      pipeline.zadd(key, now, member);
      pipeline.expire(key, windowSeconds);
      await pipeline.exec();
      return { allowed: true, count: count + 1 };
    }

    return { allowed: false, count: count };
  }

  /**
   * Token Bucket Rate Limiter
   * Suitable for bursty traffic with a steady refill rate
   * @param {string} key - Redis key
   * @param {number} capacity - Max tokens (burst size)
   * @param {number} refillRate - Tokens per second
   * @param {number} windowSeconds - Expiry for the key
   * @returns {Promise<{allowed: boolean, remaining: number}>}
   */
  async checkTokenBucket(key, capacity, refillRate, windowSeconds = 900) {
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local window = tonumber(ARGV[4])

      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(data[1])
      local lastRefill = tonumber(data[2])

      if not tokens then
        tokens = capacity
        lastRefill = now
      end

      -- Refill
      local elapsed = (now - lastRefill) / 1000
      local added = elapsed * refillRate
      tokens = math.min(capacity, tokens + added)
      lastRefill = now

      local allowed = 0
      if tokens >= 1 then
        allowed = 1
        tokens = tokens - 1
      end

      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
      redis.call('EXPIRE', key, window)
      
      return { allowed, tokens }
    `;

    const now = Date.now();
    const result = await redisClient.eval(
      script,
      1,
      key,
      capacity,
      refillRate,
      now,
      windowSeconds,
    );

    return {
      allowed: result[0] === 1,
      remaining: parseFloat(result[1]),
    };
  }

  /**
   * Simple Counter Rate Limiter
   * @param {string} key
   * @param {number} limit
   * @param {number} windowSeconds
   */
  async checkFixedWindow(key, limit, windowSeconds = 60) {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    return { allowed: current <= limit, count: current };
  }
}

module.exports = new RateLimiter();
