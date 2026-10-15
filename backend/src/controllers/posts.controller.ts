import { Request, Response } from 'express';
import {
  postIdParamSchema,
  createPostSchema,
  updatePostSchema,
  postsQuerySchema,
  postCoverUploadSchema,
  formatZodErrors,
} from '../validators/posts.validators';
import {
  PostsService,
  PostNotFoundError,
  ForbiddenPostActionError,
} from '../services/posts.service';
import {
  InvalidImageError,
  ImageTooLargeError,
} from '../services/image-processor.service';
import {
  mediaStorageService,
  StorageNotConfiguredError,
  StorageOperationError,
} from '../services/media-storage.service';

/**
 * Controller handling blog post HTTP requests.
 */
export class PostsController {
  /**
   * GET /api/v1/posts
   * Public: Retrieves paginated list of blog posts with search (q) and category filter.
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const queryResult = postsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters.',
          errors: formatZodErrors(queryResult.error),
        });
        return;
      }

      const { posts, pagination } = await PostsService.getPosts(queryResult.data);
      res.status(200).json({
        success: true,
        message: 'Posts retrieved successfully',
        data: {
          posts,
          pagination,
        },
      });
    } catch (error) {
      console.error('Error fetching posts:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching posts.',
      });
    }
  }

  /**
   * GET /api/v1/posts/:id
   * Public: Retrieves single post by UUID with safe author details.
   */
  static async getById(req: Request, res: Response): Promise<void> {
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

      const post = await PostsService.getPostById(paramResult.data.id);
      res.status(200).json({
        success: true,
        message: 'Post retrieved successfully',
        data: {
          post,
        },
      });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
        return;
      }

      console.error('Error fetching post by ID:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the post.',
      });
    }
  }

  /**
   * POST /api/v1/posts
   * Protected: Creates a new post authored by authenticated user.
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.auth?.userId;
      if (!authorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const parseResult = createPostSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: formatZodErrors(parseResult.error),
        });
        return;
      }

      const post = await PostsService.createPost(authorId, parseResult.data);
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post,
        },
      });
    } catch (error) {
      console.error('Error creating post:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the post.',
      });
    }
  }

  /**
   * PUT /api/v1/posts/:id
   * Protected: Updates an existing post. Only the owner can edit.
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.auth?.userId;
      if (!authorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const bodyResult = updatePostSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: formatZodErrors(bodyResult.error),
        });
        return;
      }

      const post = await PostsService.updatePost(
        paramResult.data.id,
        authorId,
        bodyResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: {
          post,
        },
      });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
        return;
      }

      if (error instanceof ForbiddenPostActionError) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error updating post:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the post.',
      });
    }
  }

  /**
   * DELETE /api/v1/posts/:id
   * Protected: Deletes an existing post. Only the owner can delete.
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.auth?.userId;
      if (!authorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      await PostsService.deletePost(paramResult.data.id, authorId);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
        data: {
          id: paramResult.data.id,
        },
      });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
        return;
      }

      if (error instanceof ForbiddenPostActionError) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error deleting post:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the post.',
      });
    }
  }

  /**
   * POST /api/v1/posts/:id/cover
   * Protected: Uploads or replaces the cover image for an article. Owner only.
   */
  static async uploadCover(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.auth?.userId;
      if (!authorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      if (!req.file || !req.file.buffer) {
        res.status(400).json({
          success: false,
          message: 'Cover image file is required.',
          errors: [{ field: 'cover', message: 'No file uploaded in the "cover" field.' }],
        });
        return;
      }

      const bodyResult = postCoverUploadSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid cover metadata.',
          errors: formatZodErrors(bodyResult.error),
        });
        return;
      }

      if (!mediaStorageService.isConfigured()) {
        res.status(503).json({
          success: false,
          message: 'Media storage is not configured on this server.',
        });
        return;
      }

      const post = await PostsService.uploadPostCover(
        paramResult.data.id,
        authorId,
        req.file.buffer,
        bodyResult.data.altText
      );

      res.status(200).json({
        success: true,
        message: 'Cover image uploaded successfully',
        data: {
          post,
        },
      });
    } catch (error: any) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
        return;
      }

      if (error instanceof ForbiddenPostActionError) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error instanceof InvalidImageError || error instanceof ImageTooLargeError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error instanceof StorageNotConfiguredError) {
        res.status(503).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error instanceof StorageOperationError) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error uploading post cover:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while uploading cover image.',
      });
    }
  }

  /**
   * DELETE /api/v1/posts/:id/cover
   * Protected: Removes the cover image from an article. Owner only.
   */
  static async deleteCover(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.auth?.userId;
      if (!authorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const paramResult = postIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const post = await PostsService.deletePostCover(paramResult.data.id, authorId);

      res.status(200).json({
        success: true,
        message: 'Cover image removed successfully',
        data: {
          post,
        },
      });
    } catch (error: any) {
      if (error instanceof PostNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
        return;
      }

      if (error instanceof ForbiddenPostActionError) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error deleting post cover:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting cover image.',
      });
    }
  }
}

