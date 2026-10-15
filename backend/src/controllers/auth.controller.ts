import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  formatZodErrors,
} from '../validators/auth.validators';
import { updateProfileSchema } from '../validators/profile.validators';
import {
  AuthService,
  DuplicateEmailError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../services/auth.service';

/**
 * Controller for handling authentication HTTP requests.
 */
export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registers a new user account.
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: formatZodErrors(parseResult.error),
        });
        return;
      }

      const result = await AuthService.register(parseResult.data);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Registration error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during registration. Please try again later.',
      });
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates user and returns JWT access token.
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: formatZodErrors(parseResult.error),
        });
        return;
      }

      const result = await AuthService.login(parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Login error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login. Please try again later.',
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Revokes the active session for the authenticated user.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const tokenId = req.auth?.tokenId;
      if (!tokenId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await AuthService.logout(tokenId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout. Please try again later.',
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user's profile.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await AuthService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        message: 'Current user retrieved successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(401).json({
          success: false,
          message: 'User account not found or has been deactivated.',
        });
        return;
      }

      console.error('Get me error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user profile.',
      });
    }
  }

  /**
   * PATCH /api/v1/auth/me
   * Updates authenticated user's profile (name and/or bio).
   */
  static async updateMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid profile data',
          errors: formatZodErrors(parseResult.error),
        });
        return;
      }

      const updatedUser = await AuthService.updateProfile(userId, parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(401).json({
          success: false,
          message: 'User account not found or has been deactivated.',
        });
        return;
      }

      console.error('Update profile error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating profile.',
      });
    }
  }
}
