export interface TopicItem {
  name: string;
  postCount: number;
}

export interface TopicsApiResponse {
  success: boolean;
  message: string;
  data: {
    topics: TopicItem[];
  };
}
