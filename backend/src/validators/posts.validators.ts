import { z } from 'zod';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Validates post UUID route parameter.
 */
export const postIdParamSchema = z.object({
  id: z.string({
    error: 'Post ID is required',
  }).uuid('Invalid post ID format. Expected a valid UUID.'),
});

/**
 * Schema for creating a blog post.
 * - title: required, non-empty trimmed string, max 255 chars
 * - content: required, non-empty trimmed string, max 50,000 chars
 * - category: optional, trimmed string, max 100 chars, null if empty
 */
export const createPostSchema = z.object({
  title: z
    .string({
      error: 'Title is required and must be a string',
    })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must not exceed 255 characters'),
  content: z
    .string({
      error: 'Content is required and must be a string',
    })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(50000, 'Content must not exceed 50,000 characters'),
  category: z
    .string()
    .trim()
    .max(100, 'Category must not exceed 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Schema for updating a blog post.
 */
export const updatePostSchema = z.object({
  title: z
    .string({
      error: 'Title is required and must be a string',
    })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must not exceed 255 characters'),
  content: z
    .string({
      error: 'Content is required and must be a string',
    })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(50000, 'Content must not exceed 50,000 characters'),
  category: z
    .string()
    .trim()
    .max(100, 'Category must not exceed 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/**
 * Standard pagination metadata contract across Talent Growth API.
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculates standard pagination metadata deterministically.
 */
export function buildPaginationMetadata(
  totalItems: number,
  page: number,
  limit: number
): PaginationMetadata {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

/**
 * Query schema for GET /api/v1/posts (search, category filter, pagination).
 */
export const postsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'Search query must not exceed 100 characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  category: z
    .string()
    .trim()
    .max(100, 'Category must not exceed 100 characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  page: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return val.trim();
        return val;
      },
      z
        .string()
        .regex(/^[1-9]\d*$/, 'Page must be a positive integer greater than or equal to 1')
        .transform((val) => parseInt(val, 10))
    )
    .optional()
    .default(1),
  limit: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return val.trim();
        return val;
      },
      z
        .string()
        .regex(/^[1-9]\d*$/, 'Limit must be a positive integer')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1 && val <= 50, 'Limit must be between 1 and 50')
    )
    .optional()
    .default(9),
});

export type PostsQueryInput = z.infer<typeof postsQuerySchema>;

/**
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

/**
 * Schema for post cover upload metadata.
 * - altText: optional, max 160 chars, trimmed, normalized to null if empty
 */
export const postCoverUploadSchema = z.object({
  altText: z
    .string()
    .trim()
    .max(160, 'Alt text must not exceed 160 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type PostCoverUploadInput = z.infer<typeof postCoverUploadSchema>;


