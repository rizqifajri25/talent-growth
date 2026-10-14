import { z } from 'zod';

/**
 * Validates maximum 72 bytes in UTF-8 encoding for bcrypt compatibility.
 * Bcrypt truncates any input beyond 72 bytes, so passwords exceeding 72 bytes must be rejected.
 */
const bcryptPasswordSchema = z
  .string({
    error: 'Password is required and must be a string',
  })
  .min(8, 'Password must be at least 8 characters long')
  .refine(
    (val) => Buffer.byteLength(val, 'utf8') <= 72,
    'Password must not exceed 72 bytes'
  );

/**
 * Registration schema
 * - name: string, trimmed, non-empty, max 80 characters
 * - email: valid email, trimmed and lowercased
 * - password: minimum 8 characters, maximum 72 bytes UTF-8, untrimmed
 */
export const registerSchema = z.object({
  name: z
    .string({
      error: 'Name is required and must be a string',
    })
    .trim()
    .min(1, 'Name cannot be empty')
    .max(80, 'Name must not exceed 80 characters'),
  email: z
    .string({
      error: 'Email is required and must be a string',
    })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: bcryptPasswordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login schema
 * - email: valid email, trimmed and lowercased
 * - password: string, required
 */
export const loginSchema = z.object({
  email: z
    .string({
      error: 'Email is required and must be a string',
    })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string({
      error: 'Password is required and must be a string',
    })
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Formats Zod errors into uniform API error response items.
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
