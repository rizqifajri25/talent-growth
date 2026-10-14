import { apiClient } from './client';
import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  PostsApiResponse,
  PostApiResponse,
  DeletePostApiResponse,
} from '../types/posts.types';

export const postsApi = {
  /**
   * Retrieves all posts ordered by creation date descending.
   * Public endpoint.
   */
  async getPosts(): Promise<Post[]> {
    const response = await apiClient.get<PostsApiResponse>('/posts');
    return response.data.data.posts;
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
