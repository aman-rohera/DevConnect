import request from 'supertest';
import app from '../../../server.js';
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
});
