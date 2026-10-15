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
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
