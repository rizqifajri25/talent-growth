import { apiClient } from './client';
import type {
  AuthorSummary,
  PublicAuthorProfile,
  AuthorsApiResponse,
  AuthorApiResponse,
} from '../types/authors.types';

export const authorsApi = {
  /**
   * Retrieves the directory of published authors (authors with >= 1 published post).
   * Public endpoint.
   */
  async getAuthors(): Promise<AuthorSummary[]> {
    const response = await apiClient.get<AuthorsApiResponse>('/authors');
    return response.data.data.authors;
  },

  /**
   * Retrieves the public author profile along with their published essays.
   * Public endpoint.
   */
  async getAuthorById(id: string): Promise<PublicAuthorProfile> {
    const response = await apiClient.get<AuthorApiResponse>(`/authors/${id}`);
    return response.data.data.author;
  },
};
