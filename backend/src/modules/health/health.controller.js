import prisma from '../../config/db.js';
import redisClient from '../../config/redis.js';

/**
 * Simple ultra-lightweight health route.
 * Immediately returns 200 OK for 5-minute cron job / keep-alive pings.
 */
export const getSimpleOkHealth = (req, res) => {
  if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  return res.status(200).send('OK');
};

/**
 * Basic health check endpoint.
 * Returns server status, uptime, and database connectivity state.
 */
export const getHealth = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'CONNECTED';
  } catch (err) {
    console.error('[Health Check DB Error]:', err?.message || err);
    dbStatus = 'ERROR';
  }

  const isHealthy = dbStatus === 'CONNECTED';
  const responseCode = isHealthy ? 200 : 503;

  return res.status(responseCode).json({
    success: isHealthy,
    status: isHealthy ? 'UP' : 'DOWN',
    message: isHealthy ? 'Server and database are healthy' : 'Database connection error',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    responseTimeMs: Date.now() - startTime,
    services: {
      server: 'UP',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  });
};

/**
 * Cron Job Keep-Alive & Maintenance Endpoint.
 * Pings database to prevent cold starts on free tiers (Render/Railway/ElephantSQL)
 * and performs periodic cleanup of expired sessions & OTPs.
 */
export const cronPing = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  
  // Optional security check if CRON_SECRET is configured in environment
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const providedSecret = authHeader ? authHeader.replace('Bearer ', '').trim() : querySecret;

    if (providedSecret !== cronSecret) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid CRON_SECRET token',
      });
    }
  }

  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbLatencyMs = null;
  let cleanedSessionsCount = 0;
  let cleanedOtpsCount = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'CONNECTED';

    // Perform maintenance cleanup: remove expired user sessions
    const deletedSessions = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    cleanedSessionsCount = deletedSessions.count;

    // Perform maintenance cleanup: remove expired password reset OTPs
    const deletedOtps = await prisma.passwordResetOtp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    cleanedOtpsCount = deletedOtps.count;
  } catch (err) {
    console.error('[Cron Health Ping DB Error]:', err?.message || err);
    dbStatus = 'ERROR';
  }

  const isHealthy = dbStatus === 'CONNECTED';
  const responseCode = isHealthy ? 200 : 503;

  return res.status(responseCode).json({
    success: isHealthy,
    status: isHealthy ? 'ACTIVE' : 'DEGRADED',
    message: isHealthy
      ? 'Cron ping successful. System kept alive and cleaned up.'
      : 'Cron ping failed: database connection issue.',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    maintenance: {
      cleanedExpiredSessions: cleanedSessionsCount,
      cleanedExpiredOtps: cleanedOtpsCount,
    },
    executionTimeMs: Date.now() - startTime,
  });
};

/**
 * Comprehensive System Health & Diagnostics API.
 * Checks Server, Database, Redis, Email Service, OAuth Configs, and Maintenance at once.
 */
export const getFullHealthCheck = async (req, res) => {
  const startTime = Date.now();

  // 1. Server Memory & Info
  const memoryUsage = process.memoryUsage();
  const serverInfo = {
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memoryUsageMb: {
      rss: +(memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapUsed: +(memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotal: +(memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
    },
  };

  // 2. Database Check
  let dbStatus = 'DISCONNECTED';
  let dbLatencyMs = null;
  let userCount = 0;
  let dbError = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'CONNECTED';
    userCount = await prisma.user.count();
  } catch (err) {
    dbStatus = 'ERROR';
    dbError = err?.message || 'Database query failed';
  }

  // 3. Redis Cache Check
  let redisStatus = 'DISCONNECTED';
  let redisLatencyMs = null;
  try {
    if (redisClient && redisClient.status === 'ready') {
      const redisStart = Date.now();
      await redisClient.ping();
      redisLatencyMs = Date.now() - redisStart;
      redisStatus = 'CONNECTED';
    } else {
      redisStatus = redisClient ? redisClient.status : 'DISABLED';
    }
  } catch (err) {
    redisStatus = 'ERROR';
  }

  // 4. Integrations & Configuration Status
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasGmailSmtp = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASS);
  const emailConfigured = hasResend || hasGmailSmtp || Boolean(process.env.FRONTEND_URL);

  const googleOauthConfigured = Boolean(
    (process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID) &&
    (process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET)
  );

  const githubOauthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );

  // 5. Automated Maintenance Cleanup
  let cleanedSessions = 0;
  let cleanedOtps = 0;
  if (dbStatus === 'CONNECTED') {
    try {
      const delSessions = await prisma.userSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      cleanedSessions = delSessions.count;

      const delOtps = await prisma.passwordResetOtp.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      cleanedOtps = delOtps.count;
    } catch (err) {
      console.warn('[Full Health Check Cleanup Warning]:', err?.message);
    }
  }

  const isFullyHealthy = dbStatus === 'CONNECTED';
  const statusCode = isFullyHealthy ? 200 : 503;

  return res.status(statusCode).json({
    success: isFullyHealthy,
    status: isFullyHealthy ? 'HEALTHY' : 'DEGRADED',
    message: isFullyHealthy
      ? 'All system components checked and operational'
      : `System issue detected: DB status is ${dbStatus}`,
    timestamp: new Date().toISOString(),
    summary: {
      server: 'UP',
      database: dbStatus,
      redis: redisStatus,
      email: emailConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      googleOAuth: googleOauthConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      githubOAuth: githubOauthConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    details: {
      server: serverInfo,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        totalUsers: userCount,
        error: dbError,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      services: {
        email: {
          configured: emailConfigured,
          provider: hasResend ? 'Resend API' : hasGmailSmtp ? 'Gmail SMTP' : 'Vercel API Fallback',
        },
        googleOAuth: {
          configured: googleOauthConfigured,
        },
        githubOAuth: {
          configured: githubOauthConfigured,
        },
      },
      maintenance: {
        cleanedExpiredSessions: cleanedSessions,
        cleanedExpiredOtps: cleanedOtps,
      },
    },
    executionTimeMs: Date.now() - startTime,
  });
};
