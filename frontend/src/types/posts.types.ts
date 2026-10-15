export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  category?: string | null;
}

export interface UpdatePostPayload {
  title: string;
  content: string;
  category?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PostListParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPostsResult {
  posts: Post[];
  pagination: PaginationMeta;
}

export interface PostsApiResponse {
  success: boolean;
  message: string;
  data: {
    posts: Post[];
    pagination?: PaginationMeta;
  };
}

export interface PostApiResponse {
  success: boolean;
  message: string;
  data: {
    post: Post;
  };
}

export interface DeletePostApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
  };
}

