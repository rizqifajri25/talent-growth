import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { authConfig } from '../config/auth';
import { RegisterInput, LoginInput } from '../validators/auth.validators';

export class DuplicateEmailError extends Error {
  constructor(message = 'An account with this email address already exists.') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid email or password.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User account not found.') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface JwtTokenPayload {
  sub: string;
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

/**
 * Signs a JWT with required claims.
 */
function createAccessToken(userId: string, tokenId: string): string {
  return jwt.sign(
    {
      sub: userId,
      jti: tokenId,
    },
    authConfig.jwtSecret,
    {
      algorithm: authConfig.jwtAlgorithm,
      expiresIn: authConfig.jwtExpiresInSeconds,
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
    }
  );
}

/**
 * Service handling all authentication and session business logic.
 */
export class AuthService {
  /**
   * Registers a new user, hashes password, creates initial session, and issues JWT.
   */
  static async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Hash password with bcrypt (salt rounds = 12)
    const passwordHash = await bcrypt.hash(
      input.password,
      authConfig.bcryptSaltRounds
    );

    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + authConfig.jwtExpiresInSeconds * 1000
    );

    try {
      // Execute User creation and session creation atomically in a transaction
      const { user, session } = await prisma.$transaction(async (tx) => {
        // Pre-check email existence
        const existing = await tx.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (existing) {
          throw new DuplicateEmailError();
        }

        const newUser = await tx.user.create({
          data: {
            name: input.name.trim(),
            email: normalizedEmail,
            passwordHash,
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        });

        const newSession = await tx.authSession.create({
          data: {
            userId: newUser.id,
            tokenId,
            expiresAt,
          },
          select: {
            id: true,
            tokenId: true,
            expiresAt: true,
          },
        });

        return { user: newUser, session: newSession };
      });

      const accessToken = createAccessToken(user.id, session.tokenId);

      return {
        user,
        accessToken,
        tokenType: 'Bearer',
        expiresIn: authConfig.jwtExpiresInSeconds,
      };
    } catch (error: any) {
      // Prisma P2002 error code represents unique constraint violation
      if (error?.code === 'P2002') {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  /**
   * Authenticates user with email & password, creates new session, and issues JWT.
   */
  static async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Generic message to prevent email enumeration
      throw new InvalidCredentialsError();
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Generate new session and token
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + authConfig.jwtExpiresInSeconds * 1000
    );

    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        tokenId,
        expiresAt,
      },
      select: {
        tokenId: true,
      },
    });

    const accessToken = createAccessToken(user.id, session.tokenId);

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return {
      user: safeUser,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: authConfig.jwtExpiresInSeconds,
    };
  }

  /**
   * Revokes an authentication session upon logout.
   */
  static async logout(tokenId: string): Promise<void> {
    await prisma.authSession.updateMany({
      where: {
        tokenId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves authenticated user's profile by ID.
   */
  static async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
