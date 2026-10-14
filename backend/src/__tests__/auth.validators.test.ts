import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  formatZodErrors,
} from '../validators/auth.validators';

describe('Auth Validators (Zod Schemas)', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const input = {
        name: 'John Doe',
        email: 'JOHN.DOE@Example.COM  ',
        password: 'securePassword123!',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john.doe@example.com'); // normalized
        expect(result.data.password).toBe('securePassword123!'); // not trimmed
      }
    });

    it('rejects empty or whitespace-only name', () => {
      const input = {
        name: '   ',
        email: 'user@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors.some((e) => e.field === 'name')).toBe(true);
      }
    });

    it('rejects name longer than 80 characters', () => {
      const input = {
        name: 'A'.repeat(81),
        email: 'user@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors.some((e) => e.field === 'name')).toBe(true);
      }
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = ['not-an-email', 'user@', '@domain.com', 'user@domain'];
      for (const email of invalidEmails) {
        const result = registerSchema.safeParse({
          name: 'Valid Name',
          email,
          password: 'password123',
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects password shorter than 8 characters', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors.some((e) => e.field === 'password')).toBe(true);
      }
    });

    it('rejects password exceeding 72 bytes in UTF-8', () => {
      // 73 ASCII characters = 73 bytes
      const longAscii = 'A'.repeat(73);
      const resultAscii = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: longAscii,
      });
      expect(resultAscii.success).toBe(false);

      // Multi-byte characters: 25 emoji characters (each 4 bytes = 100 bytes)
      const multiBytePass = '🚀'.repeat(25);
      expect(Buffer.byteLength(multiBytePass, 'utf8')).toBe(100);
      const resultMultiByte = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: multiBytePass,
      });
      expect(resultMultiByte.success).toBe(false);
    });

    it('accepts password exactly 72 bytes in UTF-8', () => {
      const exact72Bytes = 'B'.repeat(72);
      expect(Buffer.byteLength(exact72Bytes, 'utf8')).toBe(72);

      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: exact72Bytes,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data and normalizes email', () => {
      const input = {
        email: '  USER@Domain.COM ',
        password: 'anyPasswordString',
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@domain.com');
        expect(result.data.password).toBe('anyPasswordString');
      }
    });

    it('rejects missing or empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@domain.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
