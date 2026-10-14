import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { authConfig } from '../config/auth';
import { JwtTokenPayload } from '../services/auth.service';

export interface AuthContext {
  userId: string;
  tokenId: string;
}

// Extend Express Request interface with type-safe auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Middleware that authenticates incoming requests using Bearer JWT tokens
 * and verifies that the corresponding session in PostgreSQL is valid and active.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Authorization header is required.',
    });
    return;
  }

  // Enforce "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1].trim()) {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization header format. Expected "Bearer <token>".',
    });
    return;
  }

  const token = parts[1].trim();

  let payload: JwtTokenPayload;
  try {
    // Verify JWT cryptographic signature, algorithm, issuer, and audience
    payload = jwt.verify(token, authConfig.jwtSecret, {
      algorithms: [authConfig.jwtAlgorithm],
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
    }) as JwtTokenPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
    return;
  }

  // Validate required claims
  if (!payload.sub || typeof payload.sub !== 'string' || !payload.jti || typeof payload.jti !== 'string') {
    res.status(401).json({
      success: false,
      message: 'Malformed token claims.',
    });
    return;
  }

  try {
    // Verify session existence, revocation, and expiration against PostgreSQL
    const session = await prisma.authSession.findUnique({
      where: { tokenId: payload.jti },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: 'Session not found. Please log in again.',
      });
      return;
    }

    if (session.revokedAt !== null) {
      res.status(401).json({
        success: false,
        message: 'Session has been revoked. Please log in again.',
      });
      return;
    }

    if (session.expiresAt <= new Date()) {
      res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
      return;
    }

    if (session.userId !== payload.sub) {
      res.status(401).json({
        success: false,
        message: 'Session user mismatch.',
      });
      return;
    }

    // Attach trusted authentication context to request
    req.auth = {
      userId: session.userId,
      tokenId: payload.jti,
    };

    next();
  } catch (error) {
    // Log unexpected database error safely without leaking credentials
    console.error('Database error during session verification:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying session.',
    });
  }
}
