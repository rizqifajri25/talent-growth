import { z } from 'zod';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Validates author UUID route parameter.
 */
export const authorIdParamSchema = z.object({
  id: z.string().uuid('Invalid author ID format. Expected a valid UUID.'),
});

/**
 * Schema for updating the authenticated user's profile.
 * - name: optional string, trimmed, 1-80 chars.
 * - bio: optional string, trimmed, max 500 chars (empty string normalized to null).
 * - At least one field (name or bio) must be present.
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string({
        error: 'Name must be a string',
      })
      .trim()
      .min(1, 'Name cannot be empty')
      .max(80, 'Name must not exceed 80 characters')
      .optional(),
    bio: z
      .string({
        error: 'Bio must be a string',
      })
      .trim()
      .max(500, 'Bio must not exceed 500 characters')
      .nullable()
      .optional()
      .transform((val) =>
        val === undefined ? undefined : val && val.length > 0 ? val : null
      ),
    avatarUrl: z
      .string({
        error: 'Avatar must be a string',
      })
      .trim()
      .nullable()
      .optional()
      .transform((val) =>
        val === undefined ? undefined : val && val.length > 0 ? val : null
      ),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.bio !== undefined ||
      data.avatarUrl !== undefined,
    {
      message:
        'At least one field (name, bio, or avatarUrl) must be provided for update.',
      path: ['body'],
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Query schema for GET /api/v1/authors (author directory search and pagination).
 * - q: optional string, max 100 chars, matches name or bio. Email is excluded.
 * - page: positive integer >= 1, default 1.
 * - limit: integer 1-48, default 12.
 */
export const authorsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'Search query must not exceed 100 characters')
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
        .refine((val) => val >= 1 && val <= 48, 'Limit must be between 1 and 48')
    )
    .optional()
    .default(12),
});

export type AuthorsQueryInput = z.infer<typeof authorsQuerySchema>;

/**
 * Query schema for GET /api/v1/authors/:id (public author profile articles pagination).
 * - postsPage: positive integer >= 1, default 1.
 * - postsLimit: integer 1-24, default 6.
 */
export const authorProfileQuerySchema = z.object({
  postsPage: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return val.trim();
        return val;
      },
      z
        .string()
        .regex(/^[1-9]\d*$/, 'Posts page must be a positive integer greater than or equal to 1')
        .transform((val) => parseInt(val, 10))
    )
    .optional()
    .default(1),
  postsLimit: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return val.trim();
        return val;
      },
      z
        .string()
        .regex(/^[1-9]\d*$/, 'Posts limit must be a positive integer')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1 && val <= 24, 'Posts limit must be between 1 and 24')
    )
    .optional()
    .default(6),
});

export type AuthorProfileQueryInput = z.infer<typeof authorProfileQuerySchema>;

/**
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
