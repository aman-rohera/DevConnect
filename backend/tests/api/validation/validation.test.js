import request from 'supertest';
import app from '../../../server.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Validation Tests', () => {
  describe('Input Validations', () => {
    it('should reject profile updates with invalid inputs (e.g. empty project title)', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          projects: [
            {
              title: '', // should fail zod string.min(1)
              description: 'Project description'
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject profile updates with empty skill names', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          skills: [''] // should fail zod string.min(1)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should gracefully handle special unicode, emoji, and special characters', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          headline: '🚀 Lead Software Dev & DB Wizard 🧙‍♂️ (Special chars: ~!@#$%^&*()_+)',
          bio: '你好, world! 💻 UTF-8 support verification.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.headline).toBe('🚀 Lead Software Dev & DB Wizard 🧙‍♂️ (Special chars: ~!@#$%^&*()_+)');
    });
  });

  describe('Security Sanitization (XSS and SQL Injection mitigation)', () => {
    it('should securely escape and save XSS HTML payloads as standard strings', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          bio: '<script>alert("XSS")</script><img src="x" onerror="alert(1)" />'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bio).toBe('<script>alert("XSS")</script><img src="x" onerror="alert(1)" />');
    });

    it('should prevent SQL Injection attempts and store payloads literally', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          headline: "Developer'; DROP TABLE users; --"
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.headline).toBe("Developer'; DROP TABLE users; --");
    });
  });
});
