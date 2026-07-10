class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with a TTL (Time-To-Live)
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} ttlSeconds - Time-To-Live in seconds (default: 300 seconds / 5 mins)
   */
  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} The cached value or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if item has expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Delete a key from the cache
   * @param {string} key - Cache key
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache values
   */
  flush() {
    this.cache.clear();
  }
}

const cache = new MemoryCache();
export default cache;
