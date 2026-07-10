import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Jobs API Endpoint Tests', () => {
  let recruiterUser;
  let standardUser;
  let company;

  beforeEach(async () => {
    // 1. Create a Company
    company = await prisma.company.create({
      data: {
        name: `TestCompany_${Math.random()}`,
        slug: `test-company-${Math.random()}`,
        tagline: 'Enterprise test company',
        industry: 'Software'
      }
    });

    // 2. Create a Recruiter User
    recruiterUser = await createUser({
      role: 'RECRUITER',
      email: `recruiter_${Math.random()}@company.com`
    });

    // 3. Register User as Recruiter
    await prisma.recruiter.create({
      data: {
        userId: recruiterUser.id,
        companyId: company.id,
        title: 'Lead Talent Sourcer'
      }
    });

    // 4. Create standard user for applying
    standardUser = await createUser({
      role: 'USER',
      email: `dev_${Math.random()}@devconnect.com`
    });
  });

  it('should successfully post a new job and retrieve it in feed', async () => {
    // Post a job
    const response = await request(app)
      .post('/api/jobs')
      .set(getAuthHeaders(recruiterUser))
      .send({
        title: 'Senior Database Engineer',
        description: 'Design robust schemas and optimize queries',
        location: 'San Francisco, CA',
        salaryRange: '$120,000 - $150,000',
        type: 'FULL_TIME',
        employmentType: 'HYBRID'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.job.title).toBe('Senior Database Engineer');
    expect(response.body.job.companyId).toBe(company.id);

    // List jobs
    const listResponse = await request(app)
      .get('/api/jobs')
      .set(getAuthHeaders(standardUser));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.jobs.length).toBeGreaterThanOrEqual(1);
    expect(listResponse.body.jobs[0].title).toBe('Senior Database Engineer');
  });

  it('should successfully save a job and retrieve saved list', async () => {
    // Post job first
    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        recruiterId: (await prisma.recruiter.findUnique({ where: { userId: recruiterUser.id } })).id,
        title: 'Security Analyst',
        description: 'Vulnerability assessments',
        location: 'Remote',
        type: 'CONTRACT',
        employmentType: 'REMOTE'
      }
    });

    // Save job
    const saveResponse = await request(app)
      .post(`/api/jobs/${job.id}/save`)
      .set(getAuthHeaders(standardUser));

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.success).toBe(true);

    // Get saved list
    const savedResponse = await request(app)
      .get('/api/jobs/saved')
      .set(getAuthHeaders(standardUser));

    expect(savedResponse.status).toBe(200);
    expect(savedResponse.body.success).toBe(true);
    expect(savedResponse.body.saved.length).toBe(1);
    expect(savedResponse.body.saved[0].job.title).toBe('Security Analyst');
  });

  it('should successfully apply to a job and list applications', async () => {
    // Post job
    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        recruiterId: (await prisma.recruiter.findUnique({ where: { userId: recruiterUser.id } })).id,
        title: 'Vue.js Developer',
        description: 'Frontend SPA buildout',
        location: 'Austin, TX',
        type: 'FULL_TIME',
        employmentType: 'ON_SITE'
      }
    });

    // Apply
    const applyResponse = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set(getAuthHeaders(standardUser))
      .send({
        resumeUrl: 'https://devconnect-s3.com/resume.pdf'
      });

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.success).toBe(true);
    expect(applyResponse.body.application.resumeUrl).toBe('https://devconnect-s3.com/resume.pdf');

    // List applicants (by recruiter)
    const applicantsResponse = await request(app)
      .get(`/api/jobs/${job.id}/applications`)
      .set(getAuthHeaders(recruiterUser));

    expect(applicantsResponse.status).toBe(200);
    expect(applicantsResponse.body.success).toBe(true);
    expect(applicantsResponse.body.applications.length).toBe(1);
    expect(applicantsResponse.body.applications[0].user.id).toBe(standardUser.id);
  });
});
