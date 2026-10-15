import type { PaginationMeta } from './posts.types';

export interface AuthorSummary {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
}

export interface AuthorPost {
  id: string;
  title: string;
  content: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAuthorProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
  posts: AuthorPost[];
  pagination?: PaginationMeta;
}

export interface AuthorListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface AuthorPostsParams {
  postsPage?: number;
  postsLimit?: number;
}

export interface PaginatedAuthorsResult {
  authors: AuthorSummary[];
  pagination: PaginationMeta;
}

export interface AuthorsApiResponse {
  success: boolean;
  message: string;
  data: {
    authors: AuthorSummary[];
    pagination?: PaginationMeta;
  };
}

export interface AuthorApiResponse {
  success: boolean;
  message: string;
  data: {
    author: PublicAuthorProfile;
  };
}

