import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Companies API Endpoint Tests', () => {
  it('should successfully create, update, and follow a company profile', async () => {
    const user = await createUser();

    // 1. Create Company
    const createResponse = await request(app)
      .post('/api/companies')
      .set(getAuthHeaders(user))
      .send({
        name: 'OpenSource Labs',
        tagline: 'Building the open future',
        description: 'Creating developer tools and database systems.',
        website: 'https://opensourcelabs.org',
        industry: 'Computer Software',
        employeeCount: '10-50',
        foundedYear: 2022
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.company.name).toBe('OpenSource Labs');
    expect(createResponse.body.company.slug).toBe('opensource-labs');

    const companyId = createResponse.body.company.id;

    // 2. Fetch Company (read-through L1 cache test)
    const getResponse = await request(app)
      .get(`/api/companies/${companyId}`)
      .set(getAuthHeaders(user));

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.company.name).toBe('OpenSource Labs');

    // 3. Update Company (invalidates L1 cache test)
    const updateResponse = await request(app)
      .put(`/api/companies/${companyId}`)
      .set(getAuthHeaders(user))
      .send({
        name: 'OpenSource Labs Inc.',
        tagline: 'Leading open source innovation',
        description: 'Empowering engineering teams worldwide.'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.company.name).toBe('OpenSource Labs Inc.');

    // Fetch again to verify cache was invalidated and updated data is returned
    const getUpdatedResponse = await request(app)
      .get(`/api/companies/${companyId}`)
      .set(getAuthHeaders(user));

    expect(getUpdatedResponse.body.company.name).toBe('OpenSource Labs Inc.');

    // 4. Follow Company
    const followResponse = await request(app)
      .post(`/api/companies/${companyId}/follow`)
      .set(getAuthHeaders(user));

    expect(followResponse.status).toBe(200);
    expect(followResponse.body.success).toBe(true);
    expect(followResponse.body.message).toContain('successfully');

    // 5. Unfollow Company
    const unfollowResponse = await request(app)
      .delete(`/api/companies/${companyId}/follow`)
      .set(getAuthHeaders(user));

    expect(unfollowResponse.status).toBe(200);
    expect(unfollowResponse.body.success).toBe(true);
    expect(unfollowResponse.body.message).toContain('successfully');
  });
});
