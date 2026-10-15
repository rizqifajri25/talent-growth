import { apiClient } from './client';
import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  PostListParams,
  PaginatedPostsResult,
  PaginationMeta,
  PostsApiResponse,
  PostApiResponse,
  DeletePostApiResponse,
} from '../types/posts.types';

export const postsApi = {
  /**
   * Retrieves paginated posts with optional search term (q) and category filter.
   * Public endpoint.
   */
  async getPosts(params?: PostListParams): Promise<PaginatedPostsResult> {
    const response = await apiClient.get<PostsApiResponse>('/posts', { params });
    const posts = response.data.data.posts || [];
    const defaultPagination: PaginationMeta = {
      page: params?.page || 1,
      limit: params?.limit || 9,
      totalItems: posts.length,
      totalPages: posts.length > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    return {
      posts,
      pagination: response.data.data.pagination || defaultPagination,
    };
  },

  /**
   * Retrieves a single post by UUID.
   * Public endpoint.
   */
  async getPostById(id: string): Promise<Post> {
    const response = await apiClient.get<PostApiResponse>(`/posts/${id}`);
    return response.data.data.post;
  },

  /**
   * Creates a new post authored by authenticated user.
   * Protected endpoint (requires Bearer token via Axios interceptor).
   */
  async createPost(payload: CreatePostPayload): Promise<Post> {
    const response = await apiClient.post<PostApiResponse>('/posts', payload);
    return response.data.data.post;
  },

  /**
   * Updates an existing post. Only post owner is authorized.
   * Protected endpoint.
   */
  async updatePost(id: string, payload: UpdatePostPayload): Promise<Post> {
    const response = await apiClient.put<PostApiResponse>(`/posts/${id}`, payload);
    return response.data.data.post;
  },

  /**
   * Deletes an existing post. Only post owner is authorized.
   * Protected endpoint.
   */
  async deletePost(id: string): Promise<{ id: string }> {
    const response = await apiClient.delete<DeletePostApiResponse>(`/posts/${id}`);
    return response.data.data;
  },
};
