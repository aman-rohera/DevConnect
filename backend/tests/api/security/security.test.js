import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser, createConnection } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Security & Access Control Tests', () => {
  describe('Connection Request Ownership checks', () => {
    it('should prevent a third-party user from responding to a pending connection request', async () => {
      const userA = await createUser({ fullName: 'Alice' });
      const userB = await createUser({ fullName: 'Bob' });
      const userC = await createUser({ fullName: 'Charlie' }); // Third-party attacker

      // Alice sends request to Bob
      const conn = await createConnection(userA.id, userB.id, { status: 'PENDING' });

      // Charlie tries to accept the request
      const response = await request(app)
        .put(`/api/connections/${conn.id}/respond`)
        .set(getAuthHeaders(userC))
        .send({
          action: 'ACCEPT'
        });

      // Should be rejected because Charlie is not the receiver of the connection request
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Profile parameters ownership checks', () => {
    it('should only update the profile of the currently authenticated token user', async () => {
      const userA = await createUser({ fullName: 'Alice', headline: 'Original Alice' });
      const userB = await createUser({ fullName: 'Bob', headline: 'Original Bob' });

      // Alice sends a profile update request
      const response = await request(app)
        .put('/api/profile/update')
        .set(getAuthHeaders(userA))
        .send({
          headline: 'Updated Alice'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user A profile is updated
      expect(response.body.data.headline).toBe('Updated Alice');

      // Double check User B profile is untouched
      const profileResponse = await request(app)
        .get(`/api/profile/${userB.id}`)
        .set(getAuthHeaders(userA));
      expect(profileResponse.body.data.headline).toBe('Original Bob');
    });
  });

  describe('Company Profile update permissions checks', () => {
    it('should prevent a non-owner/non-admin user from updating a company profile', async () => {
      const userA = await createUser(); // Owner (will create company)
      const userB = await createUser(); // Attacker/unauthorized user

      // Create company under userA
      const company = await prisma.company.create({
        data: {
          name: `SecurityCompany_${Math.random()}`,
          slug: `security-company-${Math.random()}`,
          tagline: 'Secured Co',
          members: {
            create: {
              userId: userA.id,
              role: 'OWNER'
            }
          }
        }
      });

      // UserB tries to update the company
      const response = await request(app)
        .put(`/api/companies/${company.id}`)
        .set(getAuthHeaders(userB))
        .send({
          name: 'Hacked Name'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('Job Posting and Applications security checks', () => {
    it('should prevent a standard user from posting a job', async () => {
      const standardUser = await createUser();

      const response = await request(app)
        .post('/api/jobs')
        .set(getAuthHeaders(standardUser))
        .send({
          title: 'Illegal Post',
          description: 'Hacker role'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only registered recruiters');
    });

    it('should prevent a recruiter from posting a job for another company', async () => {
      const companyA = await prisma.company.create({
        data: { name: `CompanyA_${Math.random()}`, slug: `company-a-${Math.random()}` }
      });
      const companyB = await prisma.company.create({
        data: { name: `CompanyB_${Math.random()}`, slug: `company-b-${Math.random()}` }
      });

      const recruiterUser = await createUser({ role: 'RECRUITER' });
      await prisma.recruiter.create({
        data: {
          userId: recruiterUser.id,
          companyId: companyA.id,
          title: 'Sourcer A'
        }
      });

      // Try to post for companyB
      const response = await request(app)
        .post('/api/jobs')
        .set(getAuthHeaders(recruiterUser))
        .send({
          title: 'Rogue Job',
          description: 'Spying',
          companyId: companyB.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should prevent an unauthorized user from viewing applications for a job', async () => {
      const company = await prisma.company.create({
        data: { name: `Company_${Math.random()}`, slug: `company-${Math.random()}` }
      });

      const recruiterUser = await createUser({ role: 'RECRUITER' });
      const recruiter = await prisma.recruiter.create({
        data: {
          userId: recruiterUser.id,
          companyId: company.id,
          title: 'Recruiter'
        }
      });

      const job = await prisma.job.create({
        data: {
          companyId: company.id,
          recruiterId: recruiter.id,
          title: 'React Dev',
          description: 'Frontend',
          location: 'Remote'
        }
      });

      const attacker = await createUser();

      const response = await request(app)
        .get(`/api/jobs/${job.id}/applications`)
        .set(getAuthHeaders(attacker));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unauthorized');
    });
  });
});
