import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';

describe('Health & Cron API Endpoint Tests', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK with server and database status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('UP');
      expect(response.body.services.database.status).toBe('CONNECTED');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health/full', () => {
    it('should return comprehensive health report checking Server, DB, Redis, Email & OAuth', async () => {
      const response = await request(app).get('/api/health/full');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('HEALTHY');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary.server).toBe('UP');
      expect(response.body.summary.database).toBe('CONNECTED');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('server');
      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details).toHaveProperty('services');
    });
  });

  describe('GET /api/cron/ping', () => {
    it('should perform database ping and maintenance cleanup', async () => {
      const response = await request(app).get('/api/cron/ping');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.database.status).toBe('CONNECTED');
      expect(response.body).toHaveProperty('maintenance');
      expect(response.body.maintenance).toHaveProperty('cleanedExpiredSessions');
      expect(response.body.maintenance).toHaveProperty('cleanedExpiredOtps');
    });
  });
});
