import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Posts API Integration Tests', () => {
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];

  let userA: { id: string; email: string; token: string; name: string };
  let userB: { id: string; email: string; token: string; name: string };

  beforeAll(async () => {
    // Create test user A
    const emailA = `test_author_a_${crypto.randomUUID()}@example.com`;
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Author Alice',
        email: emailA,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    userA = {
      id: resA.body.data.user.id,
      email: emailA,
      token: resA.body.data.accessToken,
      name: 'Author Alice',
    };
    createdUserIds.push(userA.id);

    // Create test user B
    const emailB = `test_author_b_${crypto.randomUUID()}@example.com`;
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Author Bob',
        email: emailB,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    userB = {
      id: resB.body.data.user.id,
      email: emailB,
      token: resB.body.data.accessToken,
      name: 'Author Bob',
    };
    createdUserIds.push(userB.id);
  });

  afterAll(async () => {
    // Targeted safe cleanup of specifically created test data
    if (createdPostIds.length > 0) {
      await prisma.post.deleteMany({
        where: { id: { in: createdPostIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await prisma.$disconnect();
  });

  describe('GET /api/v1/posts', () => {
    it('returns 200 and a list of posts with safe author fields', async () => {
      const res = await request(app).get('/api/v1/posts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.posts)).toBe(true);

      // Verify no sensitive user fields leak into any post
      for (const p of res.body.data.posts) {
        expect(p.author).toBeDefined();
        expect(p.author.id).toBeDefined();
        expect(p.author.name).toBeDefined();
        expect(p.author.passwordHash).toBeUndefined();
        expect(p.author.email).toBeUndefined();
      }
    });
  });

  describe('POST /api/v1/posts', () => {
    it('successfully creates a post when authenticated (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Architectural Minimalism in Web Design',
          content: 'Exploring restraint, white porcelain canvas, and high typographical contrast.',
          category: 'Architecture',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post).toBeDefined();

      const post = res.body.data.post;
      createdPostIds.push(post.id);

      expect(post.title).toBe('Architectural Minimalism in Web Design');
      expect(post.content).toContain('Exploring restraint');
      expect(post.category).toBe('Architecture');
      expect(post.authorId).toBe(userA.id);
      expect(post.author.name).toBe(userA.name);
      expect(post.author.passwordHash).toBeUndefined();
      expect(post.author.email).toBeUndefined();

      // Verify persistent storage in PostgreSQL
      const dbPost = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(dbPost).not.toBeNull();
      expect(dbPost?.title).toBe('Architectural Minimalism in Web Design');
      expect(dbPost?.authorId).toBe(userA.id);
    });

    it('ignores authorId in request body and enforces authenticated user identity', async () => {
      const fakeAuthorId = crypto.randomUUID();

      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Enforcing Trusted Author Identity',
          content: 'Server must disregard any client-provided authorId.',
          authorId: fakeAuthorId,
        });

      expect(res.status).toBe(201);
      const post = res.body.data.post;
      createdPostIds.push(post.id);

      // Must belong to userA, never fakeAuthorId
      expect(post.authorId).toBe(userA.id);
      expect(post.authorId).not.toBe(fakeAuthorId);
    });

    it('rejects post creation without authentication (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'Unauthenticated Essay',
          content: 'This should be rejected immediately.',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects post creation with empty title or content (400 Bad Request)', async () => {
      const resEmptyTitle = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: '   ',
          content: 'Valid content here',
        });

      expect(resEmptyTitle.status).toBe(400);
      expect(resEmptyTitle.body.success).toBe(false);
      expect(resEmptyTitle.body.errors).toBeDefined();

      const resEmptyContent = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Valid Title',
          content: '   ',
        });

      expect(resEmptyContent.status).toBe(400);
      expect(resEmptyContent.body.success).toBe(false);
      expect(resEmptyContent.body.errors).toBeDefined();
    });

    it('rejects post creation with title exceeding 255 characters (400 Bad Request)', async () => {
      const longTitle = 'A'.repeat(256);
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: longTitle,
          content: 'Valid content',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('returns post details and safe author info for existing post (200 OK)', async () => {
      // Create post via userA
      const createRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Detailed Essay for Reading',
          content: 'Full essay text to be read publicly by any visitor.',
          category: 'Editorial',
        });

      const postId = createRes.body.data.post.id;
      createdPostIds.push(postId);

      // Fetch without authentication (public access)
      const res = await request(app).get(`/api/v1/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.id).toBe(postId);
      expect(res.body.data.post.title).toBe('Detailed Essay for Reading');
      expect(res.body.data.post.author.name).toBe(userA.name);
      expect(res.body.data.post.author.passwordHash).toBeUndefined();
    });

    it('returns 404 Not Found for non-existent post UUID', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app).get(`/api/v1/posts/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Post not found.');
    });

    it('returns 400 Bad Request for malformed UUID param', async () => {
      const res = await request(app).get('/api/v1/posts/not-a-valid-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    let postToEditId: string;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Original Title',
          content: 'Original content before edit.',
          category: 'Original Category',
        });
      postToEditId = createRes.body.data.post.id;
      createdPostIds.push(postToEditId);
    });

    it('allows owner (userA) to update the post (200 OK)', async () => {
      const res = await request(app)
        .put(`/api/v1/posts/${postToEditId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Updated Title by Owner',
          content: 'Updated content with fresh perspectives.',
          category: 'Refined Category',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe('Updated Title by Owner');
      expect(res.body.data.post.content).toBe('Updated content with fresh perspectives.');
      expect(res.body.data.post.category).toBe('Refined Category');

      // Verify database update
      const dbPost = await prisma.post.findUnique({
        where: { id: postToEditId },
      });
      expect(dbPost?.title).toBe('Updated Title by Owner');
    });

    it('forbids another user (userB) from editing userA post (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/v1/posts/${postToEditId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          title: 'Malicious Overwrite Attempt',
          content: 'User B should never be able to overwrite User A content.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');

      // Verify database was NOT changed by user B
      const dbPost = await prisma.post.findUnique({
        where: { id: postToEditId },
      });
      expect(dbPost?.title).toBe('Updated Title by Owner');
    });

    it('rejects unauthenticated update requests (401 Unauthorized)', async () => {
      const res = await request(app)
        .put(`/api/v1/posts/${postToEditId}`)
        .send({
          title: 'Unauthenticated Update',
          content: 'Should be blocked.',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when updating non-existent post', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app)
        .put(`/api/v1/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Non-existent post',
          content: 'Content here',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    let postToDeleteId: string;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Post Destined For Deletion',
          content: 'This will be deleted to test removal.',
        });
      postToDeleteId = createRes.body.data.post.id;
      createdPostIds.push(postToDeleteId);
    });

    it('forbids another user (userB) from deleting userA post (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postToDeleteId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify post still exists in database
      const dbPost = await prisma.post.findUnique({
        where: { id: postToDeleteId },
      });
      expect(dbPost).not.toBeNull();
    });

    it('rejects unauthenticated delete requests (401 Unauthorized)', async () => {
      const res = await request(app).delete(`/api/v1/posts/${postToDeleteId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows owner (userA) to delete their post (200 OK)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postToDeleteId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify post is removed from database
      const dbPost = await prisma.post.findUnique({
        where: { id: postToDeleteId },
      });
      expect(dbPost).toBeNull();

      // Subsequent GET must return 404
      const getRes = await request(app).get(`/api/v1/posts/${postToDeleteId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when deleting a post that does not exist', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app)
        .delete(`/api/v1/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
