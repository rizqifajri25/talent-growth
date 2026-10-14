import { apiClient } from './client';
import type {
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
  CommentsApiResponse,
  CommentApiResponse,
  DeleteCommentApiResponse,
} from '../types/comments.types';

export const commentsApi = {
  /**
   * Retrieves all comments and nested replies for an essay.
   * Public endpoint.
   */
  async getComments(postId: string): Promise<Comment[]> {
    const response = await apiClient.get<CommentsApiResponse>(`/posts/${postId}/comments`);
    return response.data.data.comments;
  },

  /**
   * Creates a new comment or nested reply for an essay.
   * Protected endpoint (requires Bearer token via Axios interceptor).
   */
  async createComment(postId: string, payload: CreateCommentPayload): Promise<Comment> {
    const response = await apiClient.post<CommentApiResponse>(
      `/posts/${postId}/comments`,
      payload
    );
    return response.data.data.comment;
  },

  /**
   * Updates an existing comment. Only comment author is authorized.
   * Protected endpoint.
   */
  async updateComment(commentId: string, payload: UpdateCommentPayload): Promise<Comment> {
    const response = await apiClient.put<CommentApiResponse>(
      `/comments/${commentId}`,
      payload
    );
    return response.data.data.comment;
  },

  /**
   * Deletes a comment. If it has replies, backend performs soft-delete; otherwise hard-deletes.
   * Protected endpoint.
   */
  async deleteComment(commentId: string): Promise<{ id: string; softDeleted: boolean }> {
    const response = await apiClient.delete<DeleteCommentApiResponse>(
      `/comments/${commentId}`
    );
    return response.data.data;
  },
};
