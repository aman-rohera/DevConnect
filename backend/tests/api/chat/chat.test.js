import request from 'supertest';
import app from '../../../server.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Chat API Endpoint Tests', () => {
  it('should successfully start a new direct message conversation', async () => {
    const userA = await createUser();
    const userB = await createUser();

    const response = await request(app)
      .post('/api/chat/conversations')
      .set(getAuthHeaders(userA))
      .send({
        targetUserId: userB.id
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.conversation.isGroup).toBe(false);
    expect(response.body.conversation.members.length).toBe(2);
  });

  it('should successfully send a message and retrieve history', async () => {
    const userA = await createUser();
    const userB = await createUser();

    // Start conversation
    const convResponse = await request(app)
      .post('/api/chat/conversations')
      .set(getAuthHeaders(userA))
      .send({
        targetUserId: userB.id
      });
    const convId = convResponse.body.conversation.id;

    // Send a message
    const msgResponse = await request(app)
      .post('/api/chat/messages')
      .set(getAuthHeaders(userA))
      .send({
        conversationId: convId,
        content: 'Hey, did the API tests pass?'
      });

    expect(msgResponse.status).toBe(201);
    expect(msgResponse.body.success).toBe(true);
    expect(msgResponse.body.message.content).toBe('Hey, did the API tests pass?');
    expect(msgResponse.body.message.senderId).toBe(userA.id);

    // Retrieve conversation history
    const historyResponse = await request(app)
      .get(`/api/chat/conversations/${convId}/messages`)
      .set(getAuthHeaders(userB));

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body.messages.length).toBe(1);
    expect(historyResponse.body.messages[0].content).toBe('Hey, did the API tests pass?');
  });

  it('should fetch own active conversations list', async () => {
    const userA = await createUser();
    const userB = await createUser();
    
    await request(app)
      .post('/api/chat/conversations')
      .set(getAuthHeaders(userA))
      .send({
        targetUserId: userB.id
      });

    const response = await request(app)
      .get('/api/chat/conversations')
      .set(getAuthHeaders(userA));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.conversations.length).toBe(1);
  });
});
