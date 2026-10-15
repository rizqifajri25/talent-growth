import { prisma } from '../config/prisma';
import type {
  CreatePostInput,
  UpdatePostInput,
  PostsQueryInput,
} from '../validators/posts.validators';
import { buildPaginationMetadata } from '../validators/posts.validators';

export class PostNotFoundError extends Error {
  constructor(message = 'Post not found.') {
    super(message);
    this.name = 'PostNotFoundError';
  }
}

export class ForbiddenPostActionError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenPostActionError';
  }
}

export const safeAuthorSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

export const safePostSelect = {
  id: true,
  title: true,
  content: true,
  category: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: safeAuthorSelect,
  },
} as const;

export class PostsService {
  /**
   * Retrieves paginated posts with optional case-insensitive search (q) and category filter.
   * Deterministically ordered by createdAt DESC, id DESC.
   */
  static async getPosts(query: Partial<PostsQueryInput> = {}) {
    const { q, category, page = 1, limit = 9 } = query;
    const whereConditions: any[] = [];

    if (q) {
      whereConditions.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (category) {
      whereConditions.push({
        category: { equals: category, mode: 'insensitive' },
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [totalItems, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        select: safePostSelect,
      }),
    ]);

    const pagination = buildPaginationMetadata(totalItems, page, limit);

    return {
      posts,
      pagination,
    };
  }

  /**
   * Retrieves all posts ordered by creation date descending (latest first).
   * Safe author details included. Legacy alias for getPosts().
   */
  static async getAllPosts() {
    return prisma.post.findMany({
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      select: safePostSelect,
    });
  }

  /**
   * Retrieves a single post by UUID.
   * Throws PostNotFoundError if no matching post is found.
   */
  static async getPostById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: safePostSelect,
    });

    if (!post) {
      throw new PostNotFoundError();
    }

    return post;
  }

  /**
   * Creates a new post authored by the authenticated user.
   * authorId is extracted strictly from the trusted requireAuth context.
   */
  static async createPost(authorId: string, data: CreatePostInput) {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category ?? null,
        authorId,
      },
      select: safePostSelect,
    });
  }

  /**
   * Updates an existing post after verifying ownership.
   * Throws PostNotFoundError if not found, or ForbiddenPostActionError if not owner.
   */
  static async updatePost(id: string, currentUserId: string, data: UpdatePostInput) {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new PostNotFoundError();
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenPostActionError('You do not have permission to edit this post.');
    }

    return prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category ?? null,
      },
      select: safePostSelect,
    });
  }

  /**
   * Deletes an existing post after verifying ownership.
   * Throws PostNotFoundError if not found, or ForbiddenPostActionError if not owner.
   */
  static async deletePost(id: string, currentUserId: string) {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new PostNotFoundError();
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenPostActionError('You do not have permission to delete this post.');
    }

    await prisma.post.delete({
      where: { id },
    });

    return { id };
  }
}
