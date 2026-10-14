import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/auth.types';

/**
 * In-Memory Access Token Store
 * Keeps the JWT strictly in RAM.
 * NEVER written to localStorage, sessionStorage, cookies, or IndexedDB.
 */
let inMemoryAccessToken: string | null = null;

export const tokenStore = {
  getToken(): string | null {
    return inMemoryAccessToken;
  },
  setToken(token: string | null): void {
    inMemoryAccessToken = token;
  },
  clearToken(): void {
    inMemoryAccessToken = null;
  },
};

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach Authorization Bearer token to requests when token is present in memory
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ExtractedApiError {
  message: string;
  fieldErrors?: Record<string, string>;
  status?: number;
}

/**
 * Extracts and normalizes errors from Axios responses without leaking internal stack traces.
 */
export function extractApiError(error: unknown): ExtractedApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    if (responseData) {
      const fieldErrors: Record<string, string> = {};
      if (Array.isArray(responseData.errors)) {
        for (const item of responseData.errors) {
          fieldErrors[item.field] = item.message;
        }
      }

      return {
        message: responseData.message || 'An error occurred with your request.',
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
        status,
      };
    }

    if (axiosError.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        status,
      };
    }

    if (!axiosError.response) {
      return {
        message:
          'Unable to reach the server. Please verify that the backend API is running.',
        status: 0,
      };
    }

    return {
      message: axiosError.message,
      status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred. Please try again.' };
}
