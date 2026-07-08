import request from 'supertest';
import app from '../../../server.js';
import { createUser, createPost } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';

describe('Posts API Endpoint Tests', () => {
  describe('POST /api/posts', () => {
    it('should successfully create a new post with content text', async () => {
      const user = await createUser({ fullName: 'Author One' });

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeaders(user))
        .send({
          content: 'Hello, this is my first post on DevConnect! #announcement'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post.content).toBe('Hello, this is my first post on DevConnect! #announcement');
      expect(response.body.post.userId).toBe(user.id);
    });

    it('should successfully create a post with content and an image', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeaders(user))
        .send({
          content: 'Visual updates!',
          imageUrl: 'https://cloudinary.com/uploaded_media_path.png'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post.imageUrl).toBe('https://cloudinary.com/uploaded_media_path.png');
    });

    it('should return 400 bad request if both content and imageUrl are missing', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeaders(user))
        .send({
          content: '',
          imageUrl: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/posts/feed', () => {
    it('should fetch the latest feed posts sorted in descending chronological order', async () => {
      const user1 = await createUser({ fullName: 'Alice Post' });
      const user2 = await createUser({ fullName: 'Bob Post' });

      // Create posts
      const post1 = await createPost(user1.id, { content: 'Post One' });
      const post2 = await createPost(user2.id, { content: 'Post Two' });

      const response = await request(app)
        .get('/api/posts/feed')
        .set(getAuthHeaders(user1));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.posts.length).toBeGreaterThanOrEqual(2);
      
      // Chronological check: latest post first
      const firstPost = response.body.posts[0];
      const secondPost = response.body.posts[1];
      
      const time1 = new Date(firstPost.createdAt).getTime();
      const time2 = new Date(secondPost.createdAt).getTime();
      expect(time1).toBeGreaterThanOrEqual(time2);
    });
  });
});
