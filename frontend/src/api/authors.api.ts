import { apiClient } from './client';
import type {
  PublicAuthorProfile,
  AuthorListParams,
  AuthorPostsParams,
  PaginatedAuthorsResult,
  AuthorsApiResponse,
  AuthorApiResponse,
} from '../types/authors.types';
import type { PaginationMeta } from '../types/posts.types';

export const authorsApi = {
  /**
   * Retrieves paginated directory of published authors with optional search (q).
   * Public endpoint.
   */
  async getAuthors(params?: AuthorListParams): Promise<PaginatedAuthorsResult> {
    const response = await apiClient.get<AuthorsApiResponse>('/authors', { params });
    const authors = response.data.data.authors || [];
    const defaultPagination: PaginationMeta = {
      page: params?.page || 1,
      limit: params?.limit || 12,
      totalItems: authors.length,
      totalPages: authors.length > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    return {
      authors,
      pagination: response.data.data.pagination || defaultPagination,
    };
  },

  /**
   * Retrieves the public author profile along with their paginated published essays.
   * Public endpoint.
   */
  async getAuthorById(
    id: string,
    params?: AuthorPostsParams
  ): Promise<PublicAuthorProfile> {
    const response = await apiClient.get<AuthorApiResponse>(`/authors/${id}`, {
      params,
    });
    return response.data.data.author;
  },
};

