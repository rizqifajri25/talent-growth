import { prisma } from '../config/prisma';
import {
  PaginationMetadata,
  buildPaginationMetadata,
} from '../validators/posts.validators';
import type {
  AuthorsQueryInput,
  AuthorProfileQueryInput,
} from '../validators/profile.validators';

export class AuthorNotFoundError extends Error {
  constructor(message: string = 'Author not found.') {
    super(message);
    this.name = 'AuthorNotFoundError';
  }
}

export interface AuthorSummary {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
  postCount: number;
}

export interface AuthorPostSummary {
  id: string;
  title: string;
  content: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicAuthorProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
  postCount: number;
  posts: AuthorPostSummary[];
  pagination: PaginationMetadata;
}

export class AuthorsService {
  /**
   * Retrieves published authors who have at least one post,
   * with optional search (name or bio) and pagination.
   * Deterministically sorted alphabetically by name ASC, id ASC.
   */
  static async getAuthorsDirectory(
    query: Partial<AuthorsQueryInput> = {}
  ): Promise<{ authors: AuthorSummary[]; pagination: PaginationMetadata }> {
    const { q, page = 1, limit = 12 } = query;

    const whereConditions: any[] = [
      {
        posts: {
          some: {},
        },
      },
    ];

    if (q) {
      whereConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: whereConditions };

    const [totalItems, rawAuthors] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
          { id: 'asc' },
        ],
      }),
    ]);

    const authors: AuthorSummary[] = rawAuthors.map((author) => ({
      id: author.id,
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      joinedAt: author.createdAt,
      postCount: author._count.posts,
    }));

    const pagination = buildPaginationMetadata(totalItems, page, limit);

    return {
      authors,
      pagination,
    };
  }

  /**
   * Retrieves public author profile along with paginated published posts
   * ordered from newest to oldest deterministically.
   */
  static async getAuthorProfile(
    authorId: string,
    query: Partial<AuthorProfileQueryInput> = {}
  ): Promise<PublicAuthorProfile> {
    const { postsPage = 1, postsLimit = 6 } = query;

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!author) {
      throw new AuthorNotFoundError('Author not found.');
    }

    const totalPosts = author._count.posts;

    const authorPosts = await prisma.post.findMany({
      where: { authorId },
      skip: (postsPage - 1) * postsLimit,
      take: postsLimit,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const pagination = buildPaginationMetadata(totalPosts, postsPage, postsLimit);

    return {
      id: author.id,
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      joinedAt: author.createdAt,
      postCount: totalPosts,
      posts: authorPosts,
      pagination,
    };
  }
}

