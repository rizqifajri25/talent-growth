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
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
