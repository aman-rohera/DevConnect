import Redis from 'ioredis';

// Create a singleton Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 1, // Fail fast if Redis is down
  retryStrategy: (times) => {
    // Reconnect after up to 3 seconds if disconnected, but don't hang requests
    return Math.min(times * 50, 3000);
  },
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',
});

redisClient.on('error', (err) => {
  console.warn('[Redis] Connection Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

export default redisClient;
