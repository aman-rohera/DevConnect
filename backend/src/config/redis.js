import Redis from 'ioredis';

const isTest = process.env.NODE_ENV === 'test';
let hasLoggedError = false;

// Create a singleton Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 1, // Fail fast if Redis is down
  enableOfflineQueue: false, // Don't queue commands if Redis is offline
  retryStrategy: (times) => {
    // Suppress endless retries in test environment or when Redis is absent
    if (isTest) return null;
    if (times > 3) return null; // Stop retrying after 3 attempts to prevent log spam
    return Math.min(times * 200, 2000);
  },
  showFriendlyErrorStack: process.env.NODE_ENV === 'development' && !isTest,
});

redisClient.on('error', (err) => {
  // Suppress connection error logs in test mode completely
  if (isTest) return;
  // In dev/prod, log once to inform developer, then stay silent until reconnected
  if (!hasLoggedError) {
    console.warn('[Redis Warning] Cache service offline (operating in fallback mode):', err.message);
    hasLoggedError = true;
  }
});

redisClient.on('connect', () => {
  hasLoggedError = false;
  console.log('[Redis] Connected successfully');
});

export default redisClient;
