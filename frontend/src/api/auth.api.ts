import { apiClient } from './client';
import type {
  ApiResponse,
  AuthResponseData,
  RegisterPayload,
  LoginPayload,
  User,
  UpdateProfilePayload,
} from '../types/auth.types';

export const authApi = {
  /**
   * Registers a new user account.
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/register',
      payload
    );

    if (!response.data.data) {
      throw new Error(response.data.message || 'Registration failed.');
    }

    return response.data.data;
  },

  /**
   * Logs in an existing user with email and password.
   */
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      payload
    );

    if (!response.data.data) {
      throw new Error(response.data.message || 'Login failed.');
    }

    return response.data.data;
  },

  /**
   * Revokes the active session on the backend.
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse>('/auth/logout');
  },

  /**
   * Fetches profile of currently authenticated user using Bearer token.
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');

    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Failed to retrieve user profile.');
    }

    return response.data.data.user;
  },

  /**
   * Updates display name and/or bio of currently authenticated user.
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(
      '/auth/me',
      payload
    );

    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Failed to update user profile.');
    }

    return response.data.data.user;
  },

  /**
   * Uploads or replaces avatar image for authenticated user using multipart/form-data.
   */
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<ApiResponse<{ user: User }>>(
      '/auth/me/avatar',
      formData
    );

    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Failed to upload avatar.');
    }

    return response.data.data.user;
  },

  /**
   * Removes avatar image for authenticated user and resets to monogram.
   */
  async deleteAvatar(): Promise<User> {
    const response = await apiClient.delete<ApiResponse<{ user: User }>>(
      '/auth/me/avatar'
    );

    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Failed to remove avatar.');
    }

    return response.data.data.user;
  },
};

