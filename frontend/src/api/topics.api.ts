import { apiClient } from './client';
import type { TopicItem, TopicsApiResponse } from '../types/topics.types';

export const topicsApi = {
  /**
   * Fetches active topic categories with published article counts.
   * Public endpoint.
   */
  async getTopics(): Promise<TopicItem[]> {
    const response = await apiClient.get<TopicsApiResponse>('/topics');
    return response.data.data?.topics || [];
  },
};
