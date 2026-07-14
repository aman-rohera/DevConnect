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

  describe('Post Actions (Likes, Shares, Comments & Replies)', () => {
    it('should toggle like on a post', async () => {
      const user = await createUser();
      const author = await createUser();
      const post = await createPost(author.id, { content: 'Post to be liked' });

      // First like (Toggle on)
      const res1 = await request(app)
        .post(`/api/posts/${post.id}/like`)
        .set(getAuthHeaders(user));
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.liked).toBe(true);
      expect(res1.body.likesCount).toBe(1);

      // Second like (Toggle off)
      const res2 = await request(app)
        .post(`/api/posts/${post.id}/like`)
        .set(getAuthHeaders(user));
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.liked).toBe(false);
      expect(res2.body.likesCount).toBe(0);
    });

    it('should log shares on a post', async () => {
      const user = await createUser();
      const author = await createUser();
      const post = await createPost(author.id, { content: 'Post to be shared' });

      const res = await request(app)
        .post(`/api/posts/${post.id}/share`)
        .set(getAuthHeaders(user));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sharesCount).toBe(1);
    });

    it('should comment and reply to a comment on a post', async () => {
      const user = await createUser();
      const author = await createUser();
      const post = await createPost(author.id, { content: 'Post to be commented' });

      // 1. Create a parent comment
      const commentRes = await request(app)
        .post(`/api/posts/${post.id}/comments`)
        .set(getAuthHeaders(user))
        .send({ content: 'This is a parent comment' });
      expect(commentRes.status).toBe(201);
      expect(commentRes.body.success).toBe(true);
      expect(commentRes.body.comment.content).toBe('This is a parent comment');
      const parentId = commentRes.body.comment.id;

      // 2. Reply to the comment
      const replyRes = await request(app)
        .post(`/api/posts/${post.id}/comments`)
        .set(getAuthHeaders(user))
        .send({ content: 'This is a reply comment', parentCommentId: parentId });
      expect(replyRes.status).toBe(201);
      expect(replyRes.body.success).toBe(true);
      expect(replyRes.body.comment.content).toBe('This is a reply comment');
      expect(replyRes.body.comment.parentCommentId).toBe(parentId);

      // 3. Fetch comments tree
      const treeRes = await request(app)
        .get(`/api/posts/${post.id}/comments`)
        .set(getAuthHeaders(user));
      expect(treeRes.status).toBe(200);
      expect(treeRes.body.success).toBe(true);
      expect(treeRes.body.comments.length).toBe(1);
      expect(treeRes.body.comments[0].id).toBe(parentId);
      expect(treeRes.body.comments[0].replies.length).toBe(1);
      expect(treeRes.body.comments[0].replies[0].content).toBe('This is a reply comment');
    });

    it('should delete a post successfully when requested by the owner', async () => {
      const user = await createUser();
      const post = await createPost(user.id, { content: 'Post to be deleted' });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set(getAuthHeaders(user));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that the post is deleted from the feed
      const checkRes = await request(app)
        .get('/api/posts/feed')
        .set(getAuthHeaders(user));
      const found = checkRes.body.posts.find(p => p.id === post.id);
      expect(found).toBeUndefined();
    });

    it('should prevent a non-owner from deleting a post', async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const post = await createPost(user.id, { content: 'Owner post' });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set(getAuthHeaders(otherUser));
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
