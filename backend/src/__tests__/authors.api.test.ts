import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Authors & Profile API Integration Tests', () => {
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];

  let authorA: { id: string; email: string; token: string; name: string; tokenId: string };
  let authorB: { id: string; email: string; token: string; name: string };
  let userWithoutPosts: { id: string; email: string; token: string; name: string };
  let post1Id: string;
  let post2Id: string;

  beforeAll(async () => {
    // 1. Create Author A (will have 2 posts and bio)
    const emailA = `test_author_dir_a_${crypto.randomUUID()}@example.com`;
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: emailA,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    authorA = {
      id: resA.body.data.user.id,
      email: emailA,
      token: resA.body.data.accessToken,
      name: 'Ada Lovelace',
      tokenId: '',
    };
    createdUserIds.push(authorA.id);

    // Set bio for Author A
    await prisma.user.update({
      where: { id: authorA.id },
      data: { bio: 'Pioneering mathematical thinker and computing analyst.' },
    });

    // 2. Create Author B (will have 1 post, no bio initially)
    const emailB = `test_author_dir_b_${crypto.randomUUID()}@example.com`;
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Charles Babbage',
        email: emailB,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    authorB = {
      id: resB.body.data.user.id,
      email: emailB,
      token: resB.body.data.accessToken,
      name: 'Charles Babbage',
    };
    createdUserIds.push(authorB.id);

    // 3. Create User with 0 posts (reader / member without publications)
    const emailReader = `test_reader_${crypto.randomUUID()}@example.com`;
    const resReader = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Curious Reader',
        email: emailReader,
        password: 'Password123!',
      });
    expect(resReader.status).toBe(201);
    userWithoutPosts = {
      id: resReader.body.data.user.id,
      email: emailReader,
      token: resReader.body.data.accessToken,
      name: 'Curious Reader',
    };
    createdUserIds.push(userWithoutPosts.id);

    // 4. Create 2 posts for Author A
    const postRes1 = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authorA.token}`)
      .send({
        title: 'Notes on the Analytical Engine',
        content: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers.',
        category: 'Computing',
      });
    expect(postRes1.status).toBe(201);
    post1Id = postRes1.body.data.post.id;
    createdPostIds.push(post1Id);

    const postRes2 = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authorA.token}`)
      .send({
        title: 'Reflections on Algorithmic Poetry',
        content: 'A discourse on harmonious interactions between science and imaginative literature.',
        category: 'Philosophy',
      });
    expect(postRes2.status).toBe(201);
    post2Id = postRes2.body.data.post.id;
    createdPostIds.push(post2Id);

    // 5. Create 1 post for Author B
    const postRes3 = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authorB.token}`)
      .send({
        title: 'Mechanical Design of Difference Engine',
        content: 'Precision gears and mechanical memory registers.',
        category: 'Hardware',
      });
    expect(postRes3.status).toBe(201);
    createdPostIds.push(postRes3.body.data.post.id);
  });

  afterAll(async () => {
    // Targeted cleanup of test-created records
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

  describe('GET /api/v1/authors (Author Directory)', () => {
    it('is publicly accessible without authentication token (200 OK)', async () => {
      const res = await request(app).get('/api/v1/authors');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Authors retrieved successfully');
      expect(Array.isArray(res.body.data.authors)).toBe(true);
    });

    it('returns published authors with accurate postCount and bio', async () => {
      const res = await request(app).get('/api/v1/authors');

      expect(res.status).toBe(200);
      const authors = res.body.data.authors;

      const foundAda = authors.find((a: { id: string }) => a.id === authorA.id);
      expect(foundAda).toBeDefined();
      expect(foundAda.name).toBe('Ada Lovelace');
      expect(foundAda.bio).toBe('Pioneering mathematical thinker and computing analyst.');
      expect(foundAda.postCount).toBe(2);
      expect(foundAda.joinedAt).toBeDefined();

      const foundCharles = authors.find((a: { id: string }) => a.id === authorB.id);
      expect(foundCharles).toBeDefined();
      expect(foundCharles.name).toBe('Charles Babbage');
      expect(foundCharles.postCount).toBe(1);
    });

    it('excludes registered users who have 0 published posts from directory', async () => {
      const res = await request(app).get('/api/v1/authors');

      expect(res.status).toBe(200);
      const authors = res.body.data.authors;
      const foundReader = authors.find((a: { id: string }) => a.id === userWithoutPosts.id);
      expect(foundReader).toBeUndefined();
    });

    it('never leaks email, passwordHash, or session details in author directory response', async () => {
      const res = await request(app).get('/api/v1/authors');

      expect(res.status).toBe(200);
      for (const author of res.body.data.authors) {
        expect(author.email).toBeUndefined();
        expect(author.passwordHash).toBeUndefined();
        expect(author.authSessions).toBeUndefined();
        expect(author.tokenId).toBeUndefined();
      }
    });

    it('orders authors alphabetically by name', async () => {
      const res = await request(app).get('/api/v1/authors');
      expect(res.status).toBe(200);
      const authors = res.body.data.authors;
      const names = authors.map((a: { name: string }) => a.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /api/v1/authors/:id (Public Author Profile)', () => {
    it('returns public profile and published posts for valid author (200 OK)', async () => {
      const res = await request(app).get(`/api/v1/authors/${authorA.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.author).toBeDefined();

      const author = res.body.data.author;
      expect(author.id).toBe(authorA.id);
      expect(author.name).toBe('Ada Lovelace');
      expect(author.bio).toBe('Pioneering mathematical thinker and computing analyst.');
      expect(author.postCount).toBe(2);
      expect(Array.isArray(author.posts)).toBe(true);
      expect(author.posts).toHaveLength(2);

      // Verify posts are ordered newest first
      const postDates = author.posts.map((p: { createdAt: string }) => new Date(p.createdAt).getTime());
      expect(postDates[0]).toBeGreaterThanOrEqual(postDates[1]);
    });

    it('allows viewing public profile for a user with 0 posts (empty posts array, postCount 0)', async () => {
      const res = await request(app).get(`/api/v1/authors/${userWithoutPosts.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.author.id).toBe(userWithoutPosts.id);
      expect(res.body.data.author.postCount).toBe(0);
      expect(res.body.data.author.posts).toHaveLength(0);
    });

    it('returns null for bio if author has not set a bio yet', async () => {
      const res = await request(app).get(`/api/v1/authors/${authorB.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.author.bio).toBeNull();
    });

    it('returns 400 Bad Request for malformed UUID', async () => {
      const res = await request(app).get('/api/v1/authors/invalid-uuid-12345');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid author ID format');
    });

    it('returns 404 Not Found for non-existent author UUID', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app).get(`/api/v1/authors/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Author not found');
    });

    it('never leaks email, passwordHash, or sensitive info in author profile', async () => {
      const res = await request(app).get(`/api/v1/authors/${authorA.id}`);

      expect(res.status).toBe(200);
      const author = res.body.data.author;
      expect(author.email).toBeUndefined();
      expect(author.passwordHash).toBeUndefined();
      expect(author.authSessions).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/auth/me (Update Authenticated User Profile)', () => {
    it('allows authenticated user to update their display name (200 OK)', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          name: 'Ada King, Countess of Lovelace',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Ada King, Countess of Lovelace');

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: authorA.id },
      });
      expect(dbUser?.name).toBe('Ada King, Countess of Lovelace');
    });

    it('allows authenticated user to update their bio (200 OK)', async () => {
      const newBio = 'First computer programmer, writer on the Analytical Engine.';
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          bio: newBio,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.bio).toBe(newBio);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: authorA.id },
      });
      expect(dbUser?.bio).toBe(newBio);
    });

    it('normalizes empty or whitespace-only bio to null (200 OK)', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorB.token}`)
        .send({
          bio: '   ',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.bio).toBeNull();

      const dbUser = await prisma.user.findUnique({
        where: { id: authorB.id },
      });
      expect(dbUser?.bio).toBeNull();
    });

    it('allows simultaneously updating both name and bio in single request', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorB.token}`)
        .send({
          name: 'Charles Babbage, FRS',
          bio: 'Polymath, mathematician, philosopher and mechanical engineer.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Charles Babbage, FRS');
      expect(res.body.data.user.bio).toBe('Polymath, mathematician, philosopher and mechanical engineer.');
    });

    it('rejects empty name with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          name: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Name cannot be empty');
    });

    it('rejects name exceeding 80 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          name: 'A'.repeat(81),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('80');
    });

    it('rejects bio exceeding 500 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          bio: 'B'.repeat(501),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('500');
    });

    it('rejects update when body is completely empty (400 Bad Request)', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('At least one field');
    });

    it('ignores attempts to tamper with protected fields (email, id, passwordHash)', async () => {
      const fakeEmail = 'hacked_email@example.com';
      const fakeId = crypto.randomUUID();

      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authorA.token}`)
        .send({
          name: 'Ada Lovelace Updated',
          email: fakeEmail,
          id: fakeId,
          passwordHash: 'fake_hash',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(authorA.id);
      expect(res.body.data.user.email).toBe(authorA.email);

      // Verify DB was NOT mutated for email or id
      const dbUser = await prisma.user.findUnique({
        where: { id: authorA.id },
      });
      expect(dbUser?.email).toBe(authorA.email);
      expect(dbUser?.id).toBe(authorA.id);
    });

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .send({
          name: 'Anonymous Hacker',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('verifies profile updates do NOT delete or affect user posts or comments', async () => {
      // Check authorA posts still exist intact
      const postsCount = await prisma.post.count({
        where: { authorId: authorA.id },
      });
      expect(postsCount).toBe(2);
    });
  });
});
