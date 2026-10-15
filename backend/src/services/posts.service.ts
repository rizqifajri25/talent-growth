import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma';
import { getStorageConfig } from '../config/storage.config';
import { mediaStorageService } from './media-storage.service';
import { ImageProcessorService } from './image-processor.service';
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
  coverImageUrl: true,
  coverImageAlt: true,
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
   * Best-effort cleanup of associated cover image from storage.
   */
  static async deletePost(id: string, currentUserId: string) {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        coverImageUrl: true,
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

    // Best-effort cleanup of cover from storage after DB deletion
    if (existing.coverImageUrl) {
      const config = getStorageConfig();
      const oldPath = mediaStorageService.extractPathFromUrl(
        existing.coverImageUrl,
        config.coversBucket
      );
      if (oldPath) {
        mediaStorageService.delete(config.coversBucket, oldPath).catch(() => {});
      }
    }

    return { id };
  }

  /**
   * Uploads and updates an article's cover image.
   * Verifies ownership: 404 if not found, 403 if not owner.
   * Generates server-side random path: userId/postId/uuid.webp
   * Uploads to SUPABASE_COVERS_BUCKET.
   * Cleans up previous cover if it was an application-managed object.
   */
  static async uploadPostCover(
    postId: string,
    currentUserId: string,
    fileBuffer: Buffer,
    altText?: string | null
  ) {
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        coverImageUrl: true,
      },
    });

    if (!existing) {
      throw new PostNotFoundError();
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenPostActionError('You do not have permission to upload a cover for this post.');
    }

    // 1. Process image with sharp (WebP, max 2400x1600, stripped EXIF)
    const processed = await ImageProcessorService.processCover(fileBuffer);

    // 2. Build server-side secure path
    const config = getStorageConfig();
    const objectPath = `${currentUserId}/${postId}/${randomUUID()}.webp`;

    // 3. Upload to storage
    const newCoverUrl = await mediaStorageService.upload(
      config.coversBucket,
      objectPath,
      processed.buffer,
      processed.contentType
    );

    // 4. Update database
    let updatedPost;
    try {
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          coverImageUrl: newCoverUrl,
          coverImageAlt: altText ?? null,
        },
        select: safePostSelect,
      });
    } catch (dbErr) {
      // Compensating cleanup of the newly uploaded object if DB update fails
      await mediaStorageService.delete(config.coversBucket, objectPath).catch(() => {});
      throw dbErr;
    }

    // 5. Best-effort cleanup of previous cover if present
    if (existing.coverImageUrl) {
      const oldPath = mediaStorageService.extractPathFromUrl(
        existing.coverImageUrl,
        config.coversBucket
      );
      if (oldPath && oldPath !== objectPath) {
        mediaStorageService.delete(config.coversBucket, oldPath).catch(() => {});
      }
    }

    return updatedPost;
  }

  /**
   * Removes an article's cover image and resets to editorial text fallback.
   * Verifies ownership: 404 if not found, 403 if not owner.
   */
  static async deletePostCover(postId: string, currentUserId: string) {
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        coverImageUrl: true,
      },
    });

    if (!existing) {
      throw new PostNotFoundError();
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenPostActionError('You do not have permission to delete the cover for this post.');
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        coverImageUrl: null,
        coverImageAlt: null,
      },
      select: safePostSelect,
    });

    // Best-effort cleanup in storage
    if (existing.coverImageUrl) {
      const config = getStorageConfig();
      const oldPath = mediaStorageService.extractPathFromUrl(
        existing.coverImageUrl,
        config.coversBucket
      );
      if (oldPath) {
        mediaStorageService.delete(config.coversBucket, oldPath).catch(() => {});
      }
    }

    return updatedPost;
  }
}
