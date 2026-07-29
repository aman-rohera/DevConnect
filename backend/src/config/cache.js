import redisClient from './redis.js';

class RedisCache {
  /**
   * Set a value in the cache with a TTL (Time-To-Live)
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} ttlSeconds - Time-To-Live in seconds (default: 300 seconds / 5 mins)
   */
  async set(key, value, ttlSeconds = 300) {
    if (redisClient.status !== 'ready') return; // Fail silently if Redis is down
    try {
      const stringifiedValue = JSON.stringify(value);
      await redisClient.setex(key, ttlSeconds, stringifiedValue);
    } catch (err) {
      console.warn(`[Redis Cache] Set Error for key ${key}:`, err.message);
    }
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} The cached value or null if expired/not found/error
   */
  async get(key) {
    if (redisClient.status !== 'ready') return null; // Fail silently
    try {
      const cached = await redisClient.get(key);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (err) {
      console.warn(`[Redis Cache] Get Error for key ${key}:`, err.message);
      return null;
    }
  }

  /**
   * Delete a key from the cache
   * @param {string} key - Cache key
   */
  async del(key) {
    if (redisClient.status !== 'ready') return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`[Redis Cache] Del Error for key ${key}:`, err.message);
    }
  }

  /**
   * Flush keys matching a specific pattern (e.g., 'posts:feed:*')
   * @param {string} pattern - Key pattern to match
   */
  async flushPattern(pattern) {
    if (redisClient.status !== 'ready') return;
    try {
      // In a real massive cluster, use SCAN, but KEYS is acceptable for this scale
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.warn(`[Redis Cache] FlushPattern Error for ${pattern}:`, err.message);
    }
  }

  /**
   * Flush all keys (use carefully)
   */
  async flush() {
    if (redisClient.status !== 'ready') return;
    try {
      await redisClient.flushdb();
    } catch (err) {
      console.warn('[Redis Cache] Flush Error:', err.message);
    }
  }
}

const cache = new RedisCache();
export default cache;
