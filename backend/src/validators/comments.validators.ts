import { z } from 'zod';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Validates post UUID route parameter.
 */
export const postIdParamSchema = z.object({
  id: z.string().uuid('Invalid post ID format. Expected a valid UUID.'),
});

/**
 * Validates comment UUID route parameter.
 */
export const commentIdParamSchema = z.object({
  id: z.string().uuid('Invalid comment ID format. Expected a valid UUID.'),
});

/**
 * Schema for creating a comment or nested reply.
 * - content: required, trimmed string, 1 to 5,000 chars.
 * - parentId: optional valid UUID.
 */
export const createCommentSchema = z.object({
  content: z
    .string({
      error: 'Content is required and must be a string',
    })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content must not exceed 5,000 characters'),
  parentId: z
    .string()
    .uuid('Invalid parent ID format. Expected a valid UUID.')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Schema for updating an existing comment.
 * - content: required, trimmed string, 1 to 5,000 chars.
 */
export const updateCommentSchema = z.object({
  content: z
    .string({
      error: 'Content is required and must be a string',
    })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content must not exceed 5,000 characters'),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

/**
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
