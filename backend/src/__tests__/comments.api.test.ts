import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Comments API Integration Tests', () => {
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];

  let userA: { id: string; email: string; token: string; name: string };
  let userB: { id: string; email: string; token: string; name: string };
  let testPost: { id: string; title: string; authorId: string };
  let secondPost: { id: string; title: string; authorId: string };

  beforeAll(async () => {
    // 1. Create Test User A
    const emailA = `test_comm_user_a_${crypto.randomUUID()}@example.com`;
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alice Commenter',
        email: emailA,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    userA = {
      id: resA.body.data.user.id,
      email: emailA,
      token: resA.body.data.accessToken,
      name: 'Alice Commenter',
    };
    createdUserIds.push(userA.id);

    // 2. Create Test User B
    const emailB = `test_comm_user_b_${crypto.randomUUID()}@example.com`;
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bob Reader',
        email: emailB,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    userB = {
      id: resB.body.data.user.id,
      email: emailB,
      token: resB.body.data.accessToken,
      name: 'Bob Reader',
    };
    createdUserIds.push(userB.id);

    // 3. Create Primary Test Post (by User A)
    const postRes1 = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        title: 'Deep Architecture in Distributed Systems',
        content: 'Exploration of eventual consistency and event sourcing architectures.',
        category: 'Architecture',
      });
    expect(postRes1.status).toBe(201);
    testPost = {
      id: postRes1.body.data.post.id,
      title: postRes1.body.data.post.title,
      authorId: userA.id,
    };
    createdPostIds.push(testPost.id);

    // 4. Create Secondary Test Post (for cross-post parent validation)
    const postRes2 = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        title: 'The Art of Typography and Spatial Rhythms',
        content: 'Editorial design principles in modern web applications.',
        category: 'Design',
      });
    expect(postRes2.status).toBe(201);
    secondPost = {
      id: postRes2.body.data.post.id,
      title: postRes2.body.data.post.title,
      authorId: userB.id,
    };
    createdPostIds.push(secondPost.id);
  });

  afterAll(async () => {
    // Targeted cleanup of test-created records only
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

  describe('GET /api/v1/posts/:id/comments', () => {
    it('returns empty comments array (200 OK) for post without comments', async () => {
      const res = await request(app).get(`/api/v1/posts/${testPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.comments)).toBe(true);
      expect(res.body.data.comments).toHaveLength(0);
    });

    it('returns 400 Bad Request for malformed post UUID', async () => {
      const res = await request(app).get('/api/v1/posts/not-a-valid-uuid/comments');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid post ID format');
    });

    it('returns 404 Not Found for non-existent post UUID', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app).get(`/api/v1/posts/${nonExistentId}/comments`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Essay not found');
    });
  });

  describe('POST /api/v1/posts/:id/comments', () => {
    it('allows authenticated user to create a top-level comment (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'This is a thoughtful comment on architectural boundaries.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBeDefined();

      const comment = res.body.data.comment;
      expect(comment.id).toBeDefined();
      expect(comment.postId).toBe(testPost.id);
      expect(comment.parentId).toBeNull();
      expect(comment.content).toBe('This is a thoughtful comment on architectural boundaries.');
      expect(comment.deletedAt).toBeNull();

      // Safe author fields only - no passwordHash or email
      expect(comment.author).toBeDefined();
      expect(comment.author.id).toBe(userA.id);
      expect(comment.author.name).toBe(userA.name);
      expect(comment.author.passwordHash).toBeUndefined();
      expect(comment.author.email).toBeUndefined();
    });

    it('ignores spoofed authorId in body and enforces authenticated JWT identity', async () => {
      const fakeAuthorId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          content: 'User B commenting while attempting to spoof authorId.',
          authorId: fakeAuthorId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.author.id).toBe(userB.id);
      expect(res.body.data.comment.author.id).not.toBe(fakeAuthorId);
    });

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .send({
          content: 'Attempting to comment anonymously.',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects empty content with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: '     ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Content cannot be empty');
    });

    it('rejects content exceeding 5,000 characters with 400 Bad Request', async () => {
      const oversizedContent = 'a'.repeat(5001);
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: oversizedContent,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('5,000');
    });

    it('rejects comment when post does not exist (404 Not Found)', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/v1/posts/${nonExistentId}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Comment on non-existent post.',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('allows creating a nested reply with a valid parentId', async () => {
      // 1. Create top-level parent comment
      const parentRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Original thread root comment.',
        });
      expect(parentRes.status).toBe(201);
      const parentId = parentRes.body.data.comment.id;

      // 2. Create reply from User B
      const replyRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          content: 'Insightful point! Here is my direct reply.',
          parentId,
        });

      expect(replyRes.status).toBe(201);
      expect(replyRes.body.data.comment.parentId).toBe(parentId);
      expect(replyRes.body.data.comment.author.id).toBe(userB.id);

      // 3. Create nested reply to reply (depth 2)
      const subReplyRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Following up on your reply.',
          parentId: replyRes.body.data.comment.id,
        });

      expect(subReplyRes.status).toBe(201);
      expect(subReplyRes.body.data.comment.parentId).toBe(replyRes.body.data.comment.id);

      // 4. Verify nested structure in GET
      const getRes = await request(app).get(`/api/v1/posts/${testPost.id}/comments`);
      expect(getRes.status).toBe(200);

      const tree = getRes.body.data.comments;
      const foundRoot = tree.find((c: { id: string }) => c.id === parentId);
      expect(foundRoot).toBeDefined();
      expect(foundRoot.replies).toHaveLength(1);
      expect(foundRoot.replies[0].id).toBe(replyRes.body.data.comment.id);
      expect(foundRoot.replies[0].replies).toHaveLength(1);
      expect(foundRoot.replies[0].replies[0].id).toBe(subReplyRes.body.data.comment.id);
    });

    it('rejects reply when parentId does not exist (404 Not Found)', async () => {
      const nonExistentParentId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Replying to ghost comment.',
          parentId: nonExistentParentId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Parent comment not found');
    });

    it('rejects reply when parent belongs to another post (400 Bad Request)', async () => {
      // Create comment on secondPost
      const foreignCommentRes = await request(app)
        .post(`/api/v1/posts/${secondPost.id}/comments`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          content: 'Comment belonging to second post.',
        });
      expect(foreignCommentRes.status).toBe(201);
      const foreignParentId = foreignCommentRes.body.data.comment.id;

      // Attempt to reply on testPost with foreign parentId
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Cross-post parent attack.',
          parentId: foreignParentId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Parent comment does not belong to this essay');
    });
  });

  describe('PUT /api/v1/comments/:id', () => {
    let commentToEditId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Original draft of comment to be updated.',
        });
      expect(res.status).toBe(201);
      commentToEditId = res.body.data.comment.id;
    });

    it('allows author to update their comment (200 OK)', async () => {
      const updatedText = 'Refined analysis with additional distributed patterns.';
      const res = await request(app)
        .put(`/api/v1/comments/${commentToEditId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: updatedText,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe(updatedText);
      expect(res.body.data.comment.author.id).toBe(userA.id);

      // Verify in database
      const dbComment = await prisma.comment.findUnique({
        where: { id: commentToEditId },
      });
      expect(dbComment?.content).toBe(updatedText);
    });

    it('rejects update attempt by non-owner with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/v1/comments/${commentToEditId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          content: 'Malicious modification by User B.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('rejects update without authentication token with 401 Unauthorized', async () => {
      const res = await request(app)
        .put(`/api/v1/comments/${commentToEditId}`)
        .send({
          content: 'Anonymous update attempt.',
        });

      expect(res.status).toBe(401);
    });

    it('rejects update on non-existent comment with 404 Not Found', async () => {
      const nonExistentCommentId = crypto.randomUUID();
      const res = await request(app)
        .put(`/api/v1/comments/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Updating ghost comment.',
        });

      expect(res.status).toBe(404);
    });

    it('rejects update with empty content (400 Bad Request)', async () => {
      const res = await request(app)
        .put(`/api/v1/comments/${commentToEditId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('physically deletes a comment with NO replies (200 OK)', async () => {
      // 1. Create a leaf comment
      const createRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Standalone comment destined for physical removal.',
        });
      expect(createRes.status).toBe(201);
      const leafId = createRes.body.data.comment.id;

      // 2. Delete it
      const deleteRes = await request(app)
        .delete(`/api/v1/comments/${leafId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.softDeleted).toBe(false);

      // 3. Verify it is physically gone from database
      const dbCheck = await prisma.comment.findUnique({
        where: { id: leafId },
      });
      expect(dbCheck).toBeNull();
    });

    it('soft deletes a comment that HAS replies and preserves reply thread', async () => {
      // 1. Create parent comment by User A
      const parentRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Parent comment with active discussion thread.',
        });
      expect(parentRes.status).toBe(201);
      const parentId = parentRes.body.data.comment.id;

      // 2. Create child reply by User B
      const replyRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          content: 'Valuable reply from User B that must not be deleted.',
          parentId,
        });
      expect(replyRes.status).toBe(201);
      const replyId = replyRes.body.data.comment.id;

      // 3. User A deletes their parent comment
      const deleteRes = await request(app)
        .delete(`/api/v1/comments/${parentId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.softDeleted).toBe(true);

      // 4. Verify in DB: record still exists with deletedAt populated
      const dbParent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      expect(dbParent).not.toBeNull();
      expect(dbParent?.deletedAt).not.toBeNull();

      // 5. Query comments list: parent shows placeholder text, reply is intact
      const listRes = await request(app).get(`/api/v1/posts/${testPost.id}/comments`);
      expect(listRes.status).toBe(200);

      const tree = listRes.body.data.comments;
      const foundParent = tree.find((c: { id: string }) => c.id === parentId);
      expect(foundParent).toBeDefined();
      expect(foundParent.content).toBe('This comment has been deleted');
      expect(foundParent.deletedAt).not.toBeNull();
      expect(foundParent.replies).toHaveLength(1);
      expect(foundParent.replies[0].id).toBe(replyId);
      expect(foundParent.replies[0].content).toBe('Valuable reply from User B that must not be deleted.');

      // 6. Verify soft-deleted comment cannot be edited
      const editDeletedRes = await request(app)
        .put(`/api/v1/comments/${parentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Trying to resurrect and edit deleted comment.',
        });
      expect(editDeletedRes.status).toBe(400);
      expect(editDeletedRes.body.message).toContain('Cannot edit a deleted comment');
    });

    it('rejects delete attempt by non-owner with 403 Forbidden', async () => {
      // User A creates a comment
      const createRes = await request(app)
        .post(`/api/v1/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Protected comment belonging to User A.',
        });
      expect(createRes.status).toBe(201);
      const commentId = createRes.body.data.comment.id;

      // User B attempts to delete User A's comment
      const deleteRes = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.message).toContain('not authorized');

      // Verify still exists in DB
      const dbCheck = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      expect(dbCheck).not.toBeNull();
    });

    it('rejects delete without token with 401 Unauthorized', async () => {
      const res = await request(app).delete(`/api/v1/comments/${crypto.randomUUID()}`);
      expect(res.status).toBe(401);
    });

    it('rejects delete on non-existent comment with 404 Not Found', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app)
        .delete(`/api/v1/comments/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
    });
  });
});
