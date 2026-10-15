import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Phase 10: Topics API & Category Taxonomy', () => {
  let testUserId: string;
  const createdPostIds: string[] = [];

  beforeAll(async () => {
    // Create an isolated author for topic integration tests
    const author = await prisma.user.create({
      data: {
        name: 'Topic Test Author',
        email: `topic.tester.${Date.now()}@example.com`,
        passwordHash: 'hashed_password_placeholder',
      },
    });
    testUserId = author.id;

    // Create posts with distinct categories and edge cases (null, empty)
    const p1 = await prisma.post.create({
      data: {
        title: 'Post about Systems',
        content: 'Content about Systems',
        category: 'Systems & Architecture',
        authorId: testUserId,
      },
    });
    createdPostIds.push(p1.id);

    const p2 = await prisma.post.create({
      data: {
        title: 'Another post about Systems',
        content: 'More Systems content',
        category: 'systems & architecture', // test case-insensitive grouping
        authorId: testUserId,
      },
    });
    createdPostIds.push(p2.id);

    const p3 = await prisma.post.create({
      data: {
        title: 'Post about DevOps',
        content: 'DevOps content',
        category: 'DevOps & CI/CD',
        authorId: testUserId,
      },
    });
    createdPostIds.push(p3.id);

    const pNull = await prisma.post.create({
      data: {
        title: 'Post without Category',
        content: 'No category content',
        category: null,
        authorId: testUserId,
      },
    });
    createdPostIds.push(pNull.id);

    const pEmpty = await prisma.post.create({
      data: {
        title: 'Post with Empty Category',
        content: 'Whitespace category content',
        category: '   ',
        authorId: testUserId,
      },
    });
    createdPostIds.push(pEmpty.id);
  });

  afterAll(async () => {
    // Targeted cleanup of records created by this test
    if (createdPostIds.length > 0) {
      await prisma.post.deleteMany({
        where: { id: { in: createdPostIds } },
      });
    }
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
  });

  it('GET /api/v1/topics should return HTTP 200 and aggregated category list', async () => {
    const res = await request(app).get('/api/v1/topics');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Topics retrieved successfully');
    expect(Array.isArray(res.body.data.topics)).toBe(true);

    const topics: Array<{ name: string; postCount: number }> = res.body.data.topics;

    // Find the test topics
    const systemsTopic = topics.find((t) => t.name.toLowerCase() === 'systems & architecture');
    const devopsTopic = topics.find((t) => t.name.toLowerCase() === 'devops & ci/cd');

    expect(systemsTopic).toBeDefined();
    expect(systemsTopic!.postCount).toBeGreaterThanOrEqual(2); // aggregated both case variants

    expect(devopsTopic).toBeDefined();
    expect(devopsTopic!.postCount).toBeGreaterThanOrEqual(1);

    // Verify null and empty categories are excluded
    const emptyTopic = topics.find((t) => !t.name || t.name.trim() === '');
    expect(emptyTopic).toBeUndefined();
  });

  it('topics response should never expose private user data or passwords', async () => {
    const res = await request(app).get('/api/v1/topics');

    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('email');
    expect(text).not.toContain('AuthSession');
  });

  it('topics are deterministically sorted in alphabetical order', async () => {
    const res = await request(app).get('/api/v1/topics');

    expect(res.status).toBe(200);
    const topics: Array<{ name: string; postCount: number }> = res.body.data.topics;

    const names = topics.map((t) => t.name);
    const sortedNames = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    expect(names).toEqual(sortedNames);
  });
});
