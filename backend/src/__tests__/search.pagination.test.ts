import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Phase 8: Search and Pagination API Tests', () => {
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];

  let testAuthor: { id: string; email: string; token: string; name: string };
  const uniqueKeyword = `QuantumNexus_${crypto.randomUUID().slice(0, 8)}`;
  const uniqueBioKeyword = `BioSpecialist_${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    // Create dedicated author for search and pagination tests
    const authorEmail = `search_author_${crypto.randomUUID()}@example.com`;
    const resAuth = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: `Dr. ${uniqueKeyword} Researcher`,
        email: authorEmail,
        password: 'Password123!',
      });
    expect(resAuth.status).toBe(201);

    testAuthor = {
      id: resAuth.body.data.user.id,
      email: authorEmail,
      token: resAuth.body.data.accessToken,
      name: `Dr. ${uniqueKeyword} Researcher`,
    };
    createdUserIds.push(testAuthor.id);

    // Update bio with unique keyword
    await prisma.user.update({
      where: { id: testAuthor.id },
      data: {
        bio: `Leading visionary and ${uniqueBioKeyword} in distributed databases.`,
      },
    });

    // Create 5 distinct posts for deterministic pagination and search testing
    const postPayloads = [
      {
        title: `Alpha Title with ${uniqueKeyword} inside`,
        content: `Standard body text about systems architecture.`,
        category: 'Architecture',
      },
      {
        title: `Beta Post with General Title`,
        content: `Body containing the magic keyword ${uniqueKeyword} deeply embedded.`,
        category: 'Engineering',
      },
      {
        title: `Gamma Post in Architecture`,
        content: `Another architecture exploration without magic word.`,
        category: 'Architecture',
      },
      {
        title: `Delta Post in Systems Design`,
        content: `Discussing consensus protocols and raft algorithms.`,
        category: 'Systems',
      },
      {
        title: `Epsilon Post in Systems Design`,
        content: `Deep dive into memory allocators and cache locality.`,
        category: 'Systems',
      },
    ];

    for (const p of postPayloads) {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${testAuthor.token}`)
        .send(p);
      expect(res.status).toBe(201);
      createdPostIds.push(res.body.data.post.id);
    }
  });

  afterAll(async () => {
    // Safe targeted cleanup
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

  describe('Posts Search (GET /api/v1/posts?q=...)', () => {
    it('searches posts by title case-insensitively', async () => {
      const res = await request(app)
        .get(`/api/v1/posts?q=${uniqueKeyword.toLowerCase()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toBeDefined();

      const matchedTitles = res.body.data.posts.map((p: any) => p.title);
      expect(matchedTitles.some((t: string) => t.includes('Alpha Title'))).toBe(true);
    });

    it('searches posts by content case-insensitively', async () => {
      const res = await request(app)
        .get(`/api/v1/posts?q=${uniqueKeyword.toUpperCase()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const matchedTitles = res.body.data.posts.map((p: any) => p.title);
      expect(matchedTitles.some((t: string) => t.includes('Beta Post'))).toBe(true);
    });

    it('normalizes search query with leading and trailing whitespace', async () => {
      const res = await request(app)
        .get(`/api/v1/posts?q=%20%20${uniqueKeyword}%20%20`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(2);
    });

    it('combines search query and category filter simultaneously', async () => {
      // Searching uniqueKeyword with category Architecture should only match Alpha Post
      const res = await request(app)
        .get(`/api/v1/posts?q=${uniqueKeyword}&category=Architecture`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.posts[0].title).toContain('Alpha Title');
      expect(res.body.data.posts[0].category).toBe('Architecture');
    });

    it('returns 200 with empty array when no posts match search query', async () => {
      const res = await request(app)
        .get('/api/v1/posts?q=NonExistentKeywordXYZ999999');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toEqual([]);
      expect(res.body.data.pagination.totalItems).toBe(0);
      expect(res.body.data.pagination.totalPages).toBe(0);
      expect(res.body.data.pagination.hasNextPage).toBe(false);
      expect(res.body.data.pagination.hasPreviousPage).toBe(false);
    });

    it('rejects search queries exceeding 100 characters with 400 Bad Request', async () => {
      const longQuery = 'a'.repeat(101);
      const res = await request(app).get(`/api/v1/posts?q=${longQuery}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid query parameters.');
    });
  });

  describe('Posts Pagination (GET /api/v1/posts?page=...&limit=...)', () => {
    it('applies default pagination parameters (page=1, limit=9)', async () => {
      const res = await request(app).get('/api/v1/posts');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(9);
      expect(typeof res.body.data.pagination.totalItems).toBe('number');
      expect(typeof res.body.data.pagination.totalPages).toBe('number');
    });

    it('retrieves distinct items between page 1 and page 2 without duplication', async () => {
      const resPage1 = await request(app).get(`/api/v1/posts?q=${uniqueKeyword}&limit=1&page=1`);
      const resPage2 = await request(app).get(`/api/v1/posts?q=${uniqueKeyword}&limit=1&page=2`);

      expect(resPage1.status).toBe(200);
      expect(resPage2.status).toBe(200);

      const page1Ids = resPage1.body.data.posts.map((p: any) => p.id);
      const page2Ids = resPage2.body.data.posts.map((p: any) => p.id);

      expect(page1Ids.length).toBe(1);
      expect(page2Ids.length).toBe(1);

      // Verify no overlap
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);

      // Verify pagination metadata flags
      expect(resPage1.body.data.pagination.hasPreviousPage).toBe(false);
      expect(resPage1.body.data.pagination.hasNextPage).toBe(true);
      expect(resPage2.body.data.pagination.hasPreviousPage).toBe(true);
      expect(resPage2.body.data.pagination.hasNextPage).toBe(false);
    });

    it('returns empty array when page exceeds total pages without error', async () => {
      const res = await request(app).get('/api/v1/posts?page=99999&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual([]);
      expect(res.body.data.pagination.page).toBe(99999);
      expect(res.body.data.pagination.hasNextPage).toBe(false);
    });

    it('rejects invalid page parameters (0, negative, decimal, text) with 400', async () => {
      const invalidPages = ['0', '-1', '1.5', 'abc', 'true'];
      for (const p of invalidPages) {
        const res = await request(app).get(`/api/v1/posts?page=${p}`);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('rejects invalid limit parameters (0, 51, text) with 400', async () => {
      const invalidLimits = ['0', '51', '-5', 'abc'];
      for (const l of invalidLimits) {
        const res = await request(app).get(`/api/v1/posts?limit=${l}`);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('Authors Directory Search and Pagination (GET /api/v1/authors)', () => {
    it('searches authors directory by author name case-insensitively', async () => {
      const res = await request(app)
        .get(`/api/v1/authors?q=${uniqueKeyword.toLowerCase()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toBeDefined();

      const matchedAuthors = res.body.data.authors;
      expect(matchedAuthors.some((a: any) => a.id === testAuthor.id)).toBe(true);
    });

    it('searches authors directory by author bio case-insensitively', async () => {
      const res = await request(app)
        .get(`/api/v1/authors?q=${uniqueBioKeyword.toLowerCase()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const matchedAuthors = res.body.data.authors;
      expect(matchedAuthors.some((a: any) => a.id === testAuthor.id)).toBe(true);
    });

    it('does NOT match authors by email address to preserve private data', async () => {
      const res = await request(app)
        .get(`/api/v1/authors?q=${testAuthor.email}`);

      expect(res.status).toBe(200);
      // Since email is not searched, it should return 0 results unless email substring is in name/bio
      const matched = res.body.data.authors.filter((a: any) => a.id === testAuthor.id);
      expect(matched.length).toBe(0);
    });

    it('supports pagination on authors directory', async () => {
      const res = await request(app).get('/api/v1/authors?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.authors.length).toBeLessThanOrEqual(2);
    });

    it('rejects invalid author directory pagination parameters with 400', async () => {
      const res = await request(app).get('/api/v1/authors?page=-1&limit=99');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Public Author Profile Articles Pagination (GET /api/v1/authors/:id)', () => {
    it('paginates author articles using postsPage and postsLimit parameters', async () => {
      const res = await request(app)
        .get(`/api/v1/authors/${testAuthor.id}?postsPage=1&postsLimit=2`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const author = res.body.data.author;
      expect(author.id).toBe(testAuthor.id);
      expect(author.posts.length).toBe(2);
      // postCount must reflect the author's total 5 posts, NOT current page limit
      expect(author.postCount).toBe(5);

      expect(author.pagination).toBeDefined();
      expect(author.pagination.page).toBe(1);
      expect(author.pagination.limit).toBe(2);
      expect(author.pagination.totalItems).toBe(5);
      expect(author.pagination.totalPages).toBe(3);
      expect(author.pagination.hasNextPage).toBe(true);
      expect(author.pagination.hasPreviousPage).toBe(false);
    });

    it('retrieves subsequent page of author articles without duplicate posts', async () => {
      const resPage1 = await request(app)
        .get(`/api/v1/authors/${testAuthor.id}?postsPage=1&postsLimit=2`);
      const resPage2 = await request(app)
        .get(`/api/v1/authors/${testAuthor.id}?postsPage=2&postsLimit=2`);

      expect(resPage1.status).toBe(200);
      expect(resPage2.status).toBe(200);

      const page1PostIds = resPage1.body.data.author.posts.map((p: any) => p.id);
      const page2PostIds = resPage2.body.data.author.posts.map((p: any) => p.id);

      const overlap = page1PostIds.filter((id: string) => page2PostIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('rejects invalid postsPage or postsLimit with 400', async () => {
      const res = await request(app)
        .get(`/api/v1/authors/${testAuthor.id}?postsPage=0&postsLimit=100`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
