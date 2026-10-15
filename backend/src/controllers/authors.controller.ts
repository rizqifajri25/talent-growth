import { Request, Response } from 'express';
import {
  authorIdParamSchema,
  authorsQuerySchema,
  authorProfileQuerySchema,
  formatZodErrors,
} from '../validators/profile.validators';
import {
  AuthorsService,
  AuthorNotFoundError,
} from '../services/authors.service';

export class AuthorsController {
  /**
   * GET /api/v1/authors
   * Public: Retrieves paginated directory of published authors with optional search (q).
   */
  static async getAllAuthors(req: Request, res: Response): Promise<void> {
    try {
      const queryResult = authorsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters.',
          errors: formatZodErrors(queryResult.error),
        });
        return;
      }

      const { authors, pagination } = await AuthorsService.getAuthorsDirectory(
        queryResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Authors retrieved successfully',
        data: {
          authors,
          pagination,
        },
      });
    } catch (error) {
      console.error('Error fetching authors directory:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving authors directory.',
      });
    }
  }

  /**
   * GET /api/v1/authors/:id
   * Public: Retrieves public author profile with paginated published posts.
   */
  static async getAuthorById(req: Request, res: Response): Promise<void> {
    try {
      const paramResult = authorIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid author ID format. Expected a valid UUID.',
          errors: formatZodErrors(paramResult.error),
        });
        return;
      }

      const queryResult = authorProfileQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters.',
          errors: formatZodErrors(queryResult.error),
        });
        return;
      }

      const author = await AuthorsService.getAuthorProfile(
        paramResult.data.id,
        queryResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Author profile retrieved successfully',
        data: {
          author,
        },
      });
    } catch (error) {
      if (error instanceof AuthorNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Author not found.',
        });
        return;
      }

      console.error('Error fetching author profile:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving author profile.',
      });
    }
  }
}

