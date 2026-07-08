import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser } from '../../factories/factories.js';

describe('Auth API Endpoint Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid inputs', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@devconnect.com',
          password: 'Password123',
          fullName: 'New Developer',
          headline: 'Full Stack Engineer',
          skills: 'React, Node, Postgres'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@devconnect.com');
      expect(response.body.data.user.fullName).toBe('New Developer');
      expect(response.body.data.user.profile.skills).toContain('React');
    });

    it('should fail registration when email already exists', async () => {
      // Seed user first
      await createUser({ email: 'duplicate@devconnect.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@devconnect.com',
          password: 'Password123',
          fullName: 'Duplicate User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exists');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          fullName: 'Invalid Email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with correct credentials and return a token', async () => {
      const user = await createUser({
        email: 'loginuser@devconnect.com',
        password: 'Password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@devconnect.com',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toHaveProperty('access_token');
      expect(response.body.data.user.email).toBe('loginuser@devconnect.com');
    });

    it('should reject login with wrong password', async () => {
      await createUser({
        email: 'wrongpass@devconnect.com',
        password: 'Password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@devconnect.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doesnotexist@devconnect.com',
          password: 'Password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Route Protection Middleware', () => {
    it('should deny access to protected routes without a token', async () => {
      const response = await request(app)
        .get('/api/profile/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No authentication token');
    });

    it('should deny access to protected routes with an invalid token', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', 'Bearer invalid_token_value');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });
});
