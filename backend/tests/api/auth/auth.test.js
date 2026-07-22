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

  describe('OTP Password Recovery Flow', () => {
    it('should generate OTP and send email for registered user', async () => {
      const user = await createUser({ email: 'otpuser@devconnect.com', password: 'OldPassword123' });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.message).toContain('OTP code');

      const otpRecord = await prisma.passwordResetOtp.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
      });

      expect(otpRecord).not.toBeNull();
      expect(otpRecord.otp).toHaveLength(6);
      expect(otpRecord.used).toBe(false);
    });

    it('should verify valid OTP and reject invalid OTP', async () => {
      const user = await createUser({ email: 'verifyotp@devconnect.com', password: 'OldPassword123' });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });
      expect(forgotRes.status).toBe(200);

      const otpRecord = await prisma.passwordResetOtp.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
      });

      expect(otpRecord).not.toBeNull();

      // Invalid OTP
      const invalidRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: user.email, otp: '000000' });
      expect(invalidRes.status).toBe(400);

      // Valid OTP
      const validRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: user.email, otp: otpRecord.otp });
      expect(validRes.status).toBe(200);
      expect(validRes.body.success).toBe(true);
    });

    it('should reset password with valid OTP and allow login with new password', async () => {
      const user = await createUser({ email: 'resetuser@devconnect.com', password: 'OldPassword123' });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });
      expect(forgotRes.status).toBe(200);

      const otpRecord = await prisma.passwordResetOtp.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
      });

      expect(otpRecord).not.toBeNull();

      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: user.email,
          otp: otpRecord.otp,
          newPassword: 'NewPassword123!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify old password fails
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'OldPassword123' });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password succeeds
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'NewPassword123!' });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
    });
  });
});

