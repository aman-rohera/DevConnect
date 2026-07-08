import request from 'supertest';
import app from '../../../server.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Profile API Endpoint Tests', () => {
  describe('GET /api/profile/me', () => {
    it('should retrieve own profile details successfully', async () => {
      const user = await createUser({
        fullName: 'John Profile',
        email: 'johnprofile@devconnect.com',
        headline: 'React Lead'
      });

      const response = await request(app)
        .get('/api/profile/me')
        .set(getAuthHeaders(user));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('johnprofile@devconnect.com');
      expect(response.body.data.headline).toBe('React Lead');
    });
  });

  describe('PUT /api/profile/update', () => {
    it('should update basic profile fields and skills successfully', async () => {
      const user = await createUser({
        fullName: 'Jane Update',
        email: 'janeupdate@devconnect.com',
        headline: 'Junior Dev',
        skills: ['HTML', 'CSS']
      });

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          headline: 'Senior Full Stack Developer',
          bio: '5+ years of scaling nodes.',
          avatarUrl: 'https://newavatar.com/image.png',
          skills: ['Node.js', 'React', 'TypeScript']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.headline).toBe('Senior Full Stack Developer');
      expect(response.body.data.bio).toBe('5+ years of scaling nodes.');
      expect(response.body.data.avatarUrl).toBe('https://newavatar.com/image.png');
      expect(response.body.data.skills).toContain('Node.js');
      expect(response.body.data.skills).not.toContain('HTML');
    });

    it('should update profile timelines and projects successfully', async () => {
      const user = await createUser({
        fullName: 'Tim Update',
        email: 'timupdate@devconnect.com'
      });

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          education: [
            {
              school: 'Stanford University',
              degree: 'M.S. in Software Engineering',
              startYear: '2024',
              endYear: '2026'
            }
          ],
          experience: [
            {
              company: 'Stripe',
              role: 'Senior Platform Engineer',
              startDate: 'January 2025',
              endDate: 'Present',
              description: 'Working on core billing platforms.'
            }
          ],
          certificates: [
            {
              name: 'CKA (Certified Kubernetes Administrator)',
              issuer: 'CNCF',
              issueDate: 'February 2025',
              link: 'https://cncf.io'
            }
          ],
          projects: [
            {
              title: 'Billing Microservice',
              description: 'High throughput ledger processing API.',
              repoUrl: 'https://github.com/stripe/billing'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.education[0].school).toBe('Stanford University');
      expect(response.body.data.experience[0].company).toBe('Stripe');
      expect(response.body.data.certificates[0].name).toBe('CKA (Certified Kubernetes Administrator)');
    });

    it('should return 400 validation error if string exceeds max limit', async () => {
      const user = await createUser();
      const longHeadline = 'a'.repeat(256); // max allowed in schema is 255

      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(user))
        .send({
          headline: longHeadline
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/profile/:id', () => {
    it('should retrieve another user profile details successfully', async () => {
      const requester = await createUser();
      const targetUser = await createUser({
        fullName: 'Target Developer',
        headline: 'Staff DBA'
      });

      const response = await request(app)
        .get(`/api/profile/${targetUser.id}`)
        .set(getAuthHeaders(requester));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe('Target Developer');
      expect(response.body.data.headline).toBe('Staff DBA');
    });

    it('should return 400 for invalid user ID format', async () => {
      const user = await createUser();

      const response = await request(app)
        .get('/api/profile/not-a-valid-uuid')
        .set(getAuthHeaders(user));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].message).toContain('Invalid user ID');
    });
  });
});
