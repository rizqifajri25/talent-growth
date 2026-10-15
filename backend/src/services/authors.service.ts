import { prisma } from '../config/prisma';

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
}

export class AuthorsService {
  /**
   * Retrieves all published authors who have at least one post,
   * sorted alphabetically by name.
   */
  static async getAuthorsDirectory(): Promise<AuthorSummary[]> {
    const rawAuthors = await prisma.user.findMany({
      where: {
        posts: {
          some: {},
        },
      },
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
      orderBy: {
        name: 'asc',
      },
    });

    return rawAuthors.map((author) => ({
      id: author.id,
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      joinedAt: author.createdAt,
      postCount: author._count.posts,
    }));
  }

  /**
   * Retrieves public author profile along with their published posts
   * ordered from newest to oldest.
   */
  static async getAuthorProfile(authorId: string): Promise<PublicAuthorProfile> {
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
        posts: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!author) {
      throw new AuthorNotFoundError('Author not found.');
    }

    return {
      id: author.id,
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      joinedAt: author.createdAt,
      postCount: author._count.posts,
      posts: author.posts,
    };
  }
}
