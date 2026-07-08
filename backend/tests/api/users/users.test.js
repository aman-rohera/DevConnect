import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser, createConnection } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Connections & Network API Tests', () => {
  describe('GET /api/connections', () => {
    it('should retrieve a list of accepted connections for the authenticated user', async () => {
      const userA = await createUser({ fullName: 'User A' });
      const userB = await createUser({ fullName: 'User B' });
      const userC = await createUser({ fullName: 'User C' });

      // Connection with B is accepted
      await createConnection(userA.id, userB.id, { status: 'ACCEPTED' });
      // Connection with C is pending
      await createConnection(userA.id, userC.id, { status: 'PENDING' });

      const response = await request(app)
        .get('/api/connections')
        .set(getAuthHeaders(userA));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connections.length).toBe(2);
      
      const conn = response.body.connections.find(c => c.status === 'ACCEPTED');
      expect(conn).toBeDefined();
    });
  });

  describe('POST /api/connections/request', () => {
    it('should successfully send a new connection request to another developer', async () => {
      const sender = await createUser({ fullName: 'Sender Dev' });
      const receiver = await createUser({ fullName: 'Receiver Dev' });

      const response = await request(app)
        .post('/api/connections/request')
        .set(getAuthHeaders(sender))
        .send({
          receiverId: receiver.id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connection.status).toBe('PENDING');
      expect(response.body.connection.senderId).toBe(sender.id);
      expect(response.body.connection.receiverId).toBe(receiver.id);
    });

    it('should prevent sending duplicate connection requests', async () => {
      const sender = await createUser();
      const receiver = await createUser();

      // Send first request
      await createConnection(sender.id, receiver.id, { status: 'PENDING' });

      const response = await request(app)
        .post('/api/connections/request')
        .set(getAuthHeaders(sender))
        .send({
          receiverId: receiver.id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connection.status).toBe('PENDING');
    });
  });

  describe('GET /api/connections/pending', () => {
    it('should retrieve a list of pending incoming connection requests', async () => {
      const sender = await createUser({ fullName: 'Pending Sender' });
      const receiver = await createUser({ fullName: 'Pending Receiver' });

      await createConnection(sender.id, receiver.id, { status: 'PENDING' });

      const response = await request(app)
        .get('/api/connections/pending')
        .set(getAuthHeaders(receiver));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requests.length).toBe(1);
      expect(response.body.requests[0].sender.fullName).toBe('Pending Sender');
    });
  });

  describe('PUT /api/connections/:connectionId/respond', () => {
    it('should successfully accept a pending connection request', async () => {
      const sender = await createUser({ fullName: 'Sender' });
      const receiver = await createUser({ fullName: 'Receiver' });

      const conn = await createConnection(sender.id, receiver.id, { status: 'PENDING' });

      const response = await request(app)
        .put(`/api/connections/${conn.id}/respond`)
        .set(getAuthHeaders(receiver))
        .send({
          action: 'ACCEPT'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connection.status).toBe('ACCEPTED');
    });

    it('should reject a pending connection request', async () => {
      const sender = await createUser({ fullName: 'Sender' });
      const receiver = await createUser({ fullName: 'Receiver' });

      const conn = await createConnection(sender.id, receiver.id, { status: 'PENDING' });

      const response = await request(app)
        .put(`/api/connections/${conn.id}/respond`)
        .set(getAuthHeaders(receiver))
        .send({
          action: 'REJECT'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Let's verify connection status is REJECTED in database
      const dbConn = await prisma.connection.findUnique({
        where: { id: conn.id }
      });
      expect(dbConn.status).toBe('REJECTED');
    });
  });
});
