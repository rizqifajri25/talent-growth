import { prisma } from '../config/prisma';
import type { CreateCommentInput, UpdateCommentInput } from '../validators/comments.validators';

export class PostNotFoundError extends Error {
  constructor(message: string = 'Post not found') {
    super(message);
    this.name = 'PostNotFoundError';
  }
}

export class CommentNotFoundError extends Error {
  constructor(message: string = 'Comment not found') {
    super(message);
    this.name = 'CommentNotFoundError';
  }
}

export class ParentCommentNotFoundError extends Error {
  constructor(message: string = 'Parent comment not found') {
    super(message);
    this.name = 'ParentCommentNotFoundError';
  }
}

export class ParentCommentPostMismatchError extends Error {
  constructor(message: string = 'Parent comment does not belong to this essay') {
    super(message);
    this.name = 'ParentCommentPostMismatchError';
  }
}

export class ForbiddenCommentActionError extends Error {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message);
    this.name = 'ForbiddenCommentActionError';
  }
}

export class CommentAlreadyDeletedError extends Error {
  constructor(message: string = 'Cannot edit a deleted comment') {
    super(message);
    this.name = 'CommentAlreadyDeletedError';
  }
}

export interface SafeAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CommentNode {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  author: SafeAuthor;
  replies: CommentNode[];
}

export interface RawCommentWithAuthor {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  author: SafeAuthor;
}

/**
 * Transforms flat array of comments into a hierarchically nested tree structure.
 * Maintains earliest-first ordering for each nested level.
 * Replaces content with placeholder if comment is soft-deleted.
 */
export function buildCommentTree(rawComments: RawCommentWithAuthor[]): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const rootNodes: CommentNode[] = [];

  // Pass 1: Initialize comment nodes
  for (const comment of rawComments) {
    nodeMap.set(comment.id, {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.deletedAt ? 'This comment has been deleted' : comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
      author: comment.author,
      replies: [],
    });
  }

  // Pass 2: Connect child comments to their respective parents
  for (const comment of rawComments) {
    const node = nodeMap.get(comment.id)!;
    if (comment.parentId && nodeMap.has(comment.parentId)) {
      nodeMap.get(comment.parentId)!.replies.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

export class CommentsService {
  /**
   * Retrieves all comments for a post in nested tree structure.
   */
  static async getCommentsByPostId(postId: string): Promise<CommentNode[]> {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new PostNotFoundError('Essay not found');
    }

    const rawComments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        postId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return buildCommentTree(rawComments);
  }

  /**
   * Creates a new comment or nested reply for an essay.
   */
  static async createComment(
    postId: string,
    authorId: string,
    input: CreateCommentInput
  ): Promise<CommentNode> {
    // 1. Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new PostNotFoundError('Essay not found');
    }

    // 2. If parentId provided, verify parent exists and belongs to the same post
    if (input.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true },
      });

      if (!parent) {
        throw new ParentCommentNotFoundError('Parent comment not found');
      }

      if (parent.postId !== postId) {
        throw new ParentCommentPostMismatchError('Parent comment does not belong to this essay');
      }
    }

    // 3. Insert comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        parentId: input.parentId ?? null,
        content: input.content,
      },
      select: {
        id: true,
        postId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      ...comment,
      replies: [],
    };
  }

  /**
   * Updates an existing comment. Requires author ownership.
   */
  static async updateComment(
    commentId: string,
    userId: string,
    input: UpdateCommentInput
  ): Promise<Omit<CommentNode, 'replies'>> {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new CommentNotFoundError('Comment not found');
    }

    if (existing.deletedAt !== null) {
      throw new CommentAlreadyDeletedError('Cannot edit a deleted comment');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenCommentActionError('You are not authorized to edit this comment');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: input.content,
      },
      select: {
        id: true,
        postId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Deletes a comment. If it has replies, performs soft delete; otherwise hard deletes.
   */
  static async deleteComment(
    commentId: string,
    userId: string
  ): Promise<{ id: string; softDeleted: boolean }> {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        deletedAt: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!existing) {
      throw new CommentNotFoundError('Comment not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenCommentActionError('You are not authorized to delete this comment');
    }

    // If comment has replies, preserve tree structure via soft delete
    if (existing._count.replies > 0) {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          deletedAt: new Date(),
          content: 'This comment has been deleted',
        },
      });

      return { id: commentId, softDeleted: true };
    }

    // Otherwise, perform physical deletion
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { id: commentId, softDeleted: false };
  }
}
