import { beforeAll, afterAll, beforeEach } from 'vitest';
import prisma from '../src/config/db.js';
import { cleanupDatabase } from './helpers/db-setup.js';

beforeAll(async () => {
  // Ensure we are running against the test database environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Prevented execution: NODE_ENV is not set to test.');
  }
  
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to the test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean database before each test run
  await cleanupDatabase();
});

afterAll(async () => {
  // Final database cleanup and connection teardown
  await cleanupDatabase();
  await prisma.$disconnect();
});
