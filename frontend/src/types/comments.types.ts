export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: CommentAuthor;
  replies: Comment[];
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string | null;
}

export interface UpdateCommentPayload {
  content: string;
}

export interface CommentsApiResponse {
  success: boolean;
  message: string;
  data: {
    comments: Comment[];
  };
}

export interface CommentApiResponse {
  success: boolean;
  message: string;
  data: {
    comment: Comment;
  };
}

export interface DeleteCommentApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    softDeleted: boolean;
  };
}
