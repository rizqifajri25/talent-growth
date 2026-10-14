import { Request, Response } from 'express';
import {
  postIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
  updateCommentSchema,
  formatZodErrors,
} from '../validators/comments.validators';
import {
  CommentsService,
  PostNotFoundError,
  CommentNotFoundError,
  ParentCommentNotFoundError,
  ParentCommentPostMismatchError,
  ForbiddenCommentActionError,
  CommentAlreadyDeletedError,
} from '../services/comments.service';

export class CommentsController {
  /**
   * GET /api/v1/posts/:id/comments
   * Public: Retrieves nested comments tree for an essay.
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const comments = await CommentsService.getCommentsByPostId(paramResult.data.id);
      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: {
          comments,
        },
      });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Essay not found.',
        });
        return;
      }

      console.error('Error fetching comments:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching comments.',
      });
    }
  }

  /**
   * POST /api/v1/posts/:id/comments
   * Protected: Creates a new comment or nested reply.
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const bodyResult = createCommentSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for comment data.',
          errors: formatZodErrors(bodyResult.error),
        });
        return;
      }

      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const comment = await CommentsService.createComment(
        paramResult.data.id,
        userId,
        bodyResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Essay not found.',
        });
        return;
      }

      if (error instanceof ParentCommentNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Parent comment not found.',
        });
        return;
      }

      if (error instanceof ParentCommentPostMismatchError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error creating comment:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating comment.',
      });
    }
  }

  /**
   * PUT /api/v1/comments/:id
   * Protected: Updates an existing comment. Only author is authorized.
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const paramResult = commentIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid comment ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const bodyResult = updateCommentSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for updated comment content.',
          errors: formatZodErrors(bodyResult.error),
        });
        return;
      }

      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const comment = await CommentsService.updateComment(
        paramResult.data.id,
        userId,
        bodyResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      if (error instanceof CommentNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Comment not found.',
        });
        return;
      }

      if (error instanceof CommentAlreadyDeletedError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenCommentActionError) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to edit this comment.',
        });
        return;
      }

      console.error('Error updating comment:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating comment.',
      });
    }
  }

  /**
   * DELETE /api/v1/comments/:id
   * Protected: Deletes a comment. If it has replies, soft-deletes; otherwise hard-deletes.
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const paramResult = commentIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid comment ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await CommentsService.deleteComment(
        paramResult.data.id,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.softDeleted
          ? 'Comment marked as deleted to preserve reply thread'
          : 'Comment deleted successfully',
        data: {
          id: result.id,
          softDeleted: result.softDeleted,
        },
      });
    } catch (error) {
      if (error instanceof CommentNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Comment not found.',
        });
        return;
      }

      if (error instanceof ForbiddenCommentActionError) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this comment.',
        });
        return;
      }

      console.error('Error deleting comment:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting comment.',
      });
    }
  }
}
