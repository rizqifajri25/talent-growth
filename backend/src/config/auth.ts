import 'dotenv/config';

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

export interface AuthConfig {
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtExpiresInSeconds: number;
  bcryptSaltRounds: number;
  jwtAlgorithm: 'HS256';
}

function loadAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new AuthConfigError(
      'JWT_SECRET environment variable is missing. Authentication cannot function securely.'
    );
  }

  if (jwtSecret.length < 32) {
    throw new AuthConfigError(
      'JWT_SECRET must have sufficient entropy with a minimum length of 32 characters.'
    );
  }

  const jwtIssuer = process.env.JWT_ISSUER?.trim() || 'talent-growth-api';
  const jwtAudience = process.env.JWT_AUDIENCE?.trim() || 'talent-growth-web';
  const ttlRaw = process.env.JWT_ACCESS_TOKEN_TTL_SECONDS;
  const jwtExpiresInSeconds = ttlRaw ? parseInt(ttlRaw, 10) : 900;

  if (isNaN(jwtExpiresInSeconds) || jwtExpiresInSeconds <= 0) {
    throw new AuthConfigError(
      'JWT_ACCESS_TOKEN_TTL_SECONDS must be a positive integer.'
    );
  }

  return {
    jwtSecret,
    jwtIssuer,
    jwtAudience,
    jwtExpiresInSeconds,
    bcryptSaltRounds: 12,
    jwtAlgorithm: 'HS256',
  };
}

export const authConfig = loadAuthConfig();
