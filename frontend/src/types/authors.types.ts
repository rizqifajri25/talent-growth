export interface AuthorSummary {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
}

export interface AuthorPost {
  id: string;
  title: string;
  content: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAuthorProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
  posts: AuthorPost[];
}

export interface AuthorsApiResponse {
  success: boolean;
  message: string;
  data: {
    authors: AuthorSummary[];
  };
}

export interface AuthorApiResponse {
  success: boolean;
  message: string;
  data: {
    author: PublicAuthorProfile;
  };
}
