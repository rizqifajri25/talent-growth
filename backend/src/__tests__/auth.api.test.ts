import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/prisma';
import { authConfig } from '../config/auth';

describe('Auth API Integration Tests', () => {
  // Track created user IDs for safe, targeted cleanup
  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      // Cascades to auth_sessions automatically
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a user with valid data (201 Created)', async () => {
      const email = `test_${crypto.randomUUID()}@example.com`;
      const password = 'SuperSecret123!';

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: `  ${email.toUpperCase()}  `, // Test normalization
          password,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.data).toBeDefined();

      const { user, accessToken, tokenType, expiresIn } = res.body.data;
      expect(user.id).toBeDefined();
      createdUserIds.push(user.id);

      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe(email.toLowerCase());
      expect(user.passwordHash).toBeUndefined(); // NEVER returned to client
      expect(accessToken).toBeDefined();
      expect(tokenType).toBe('Bearer');
      expect(expiresIn).toBe(authConfig.jwtExpiresInSeconds);

      // Verify in database: password is NOT stored as plaintext, but hashed with bcrypt
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe(password);
      expect(dbUser?.passwordHash.startsWith('$2b$12$')).toBe(true);

      // Verify initial session was created in database
      const dbSession = await prisma.authSession.findFirst({
        where: { userId: user.id },
      });
      expect(dbSession).toBeDefined();
      expect(dbSession?.revokedAt).toBeNull();
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const email = `dup_${crypto.randomUUID()}@example.com`;

      const firstRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'First User',
          email,
          password: 'Password123!',
        });
      expect(firstRes.status).toBe(201);
      createdUserIds.push(firstRes.body.data.user.id);

      const dupRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email: email.toUpperCase(),
          password: 'Password456!',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toContain('already exists');
    });

    it('rejects invalid inputs with 400 Bad Request', async () => {
      // Empty name
      const resEmptyName = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '   ',
          email: `test_${crypto.randomUUID()}@example.com`,
          password: 'ValidPassword123!',
        });
      expect(resEmptyName.status).toBe(400);
      expect(resEmptyName.body.success).toBe(false);
      expect(resEmptyName.body.errors).toBeDefined();

      // Invalid email
      const resBadEmail = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid Name',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });
      expect(resBadEmail.status).toBe(400);

      // Short password (< 8 chars)
      const resShortPass = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid Name',
          email: `test_${crypto.randomUUID()}@example.com`,
          password: 'short',
        });
      expect(resShortPass.status).toBe(400);

      // Password exceeding 72 bytes
      const resLongPass = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid Name',
          email: `test_${crypto.randomUUID()}@example.com`,
          password: 'A'.repeat(75),
        });
      expect(resLongPass.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully logs in with valid credentials (200 OK)', async () => {
      const email = `login_${crypto.randomUUID()}@example.com`;
      const password = 'MySecretPassword123!';

      // Create user via register
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Login User',
          email,
          password,
        });
      createdUserIds.push(regRes.body.data.user.id);

      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `  ${email.toUpperCase()}  `,
          password,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.message).toBe('Login successful');

      const { user, accessToken, tokenType, expiresIn } = loginRes.body.data;
      expect(user.id).toBe(regRes.body.data.user.id);
      expect(user.passwordHash).toBeUndefined();
      expect(tokenType).toBe('Bearer');
      expect(expiresIn).toBe(authConfig.jwtExpiresInSeconds);

      // Verify JWT signature and claims
      const decoded = jwt.verify(accessToken, authConfig.jwtSecret, {
        issuer: authConfig.jwtIssuer,
        audience: authConfig.jwtAudience,
      }) as any;

      expect(decoded.sub).toBe(user.id);
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBe(authConfig.jwtIssuer);
      expect(decoded.aud).toBe(authConfig.jwtAudience);
    });

    it('rejects incorrect password with 401 Unauthorized', async () => {
      const email = `wrongpass_${crypto.randomUUID()}@example.com`;
      const password = 'CorrectPassword123!';

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'User', email, password });
      createdUserIds.push(regRes.body.data.user.id);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword999!' });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.message).toBe('Invalid email or password.');
    });

    it('returns generic error for non-existent email (401 Unauthorized)', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.message).toBe('Invalid email or password.');
    });
  });

  describe('requireAuth Middleware & GET /api/v1/auth/me', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('header is required');
    });

    it('returns 401 when Authorization header format is invalid', async () => {
      const res1 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic 123456');
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer');
      expect(res2.status).toBe(401);
    });

    it('returns 401 when JWT signature is invalid', async () => {
      const fakeToken = jwt.sign(
        { sub: 'random-user-id', jti: 'random-token-id' },
        'wrong-secret-key-that-does-not-match',
        { issuer: authConfig.jwtIssuer, audience: authConfig.jwtAudience }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authorization token');
    });

    it('returns 401 when token has expired', async () => {
      const expiredToken = jwt.sign(
        { sub: 'some-user', jti: 'some-token' },
        authConfig.jwtSecret,
        {
          expiresIn: -10, // already expired
          issuer: authConfig.jwtIssuer,
          audience: authConfig.jwtAudience,
        }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
    });

    it('returns 401 when token has wrong issuer or audience', async () => {
      const wrongIssuerToken = jwt.sign(
        { sub: 'some-user', jti: 'some-token' },
        authConfig.jwtSecret,
        {
          issuer: 'wrong-issuer',
          audience: authConfig.jwtAudience,
        }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${wrongIssuerToken}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is validly signed but has no database session', async () => {
      const orphanToken = jwt.sign(
        { sub: crypto.randomUUID(), jti: crypto.randomUUID() },
        authConfig.jwtSecret,
        {
          issuer: authConfig.jwtIssuer,
          audience: authConfig.jwtAudience,
          expiresIn: 900,
        }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${orphanToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Session not found');
    });

    it('returns 200 and user profile with a valid token', async () => {
      const email = `me_${crypto.randomUUID()}@example.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Me User',
          email,
          password: 'Password123!',
        });
      createdUserIds.push(regRes.body.data.user.id);
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe(regRes.body.data.user.id);
      expect(res.body.data.user.name).toBe('Me User');
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('successfully revokes session and blocks further access with that token', async () => {
      // 1. Register User A
      const emailA = `logout_a_${crypto.randomUUID()}@example.com`;
      const regA = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'User A', email: emailA, password: 'Password123!' });
      createdUserIds.push(regA.body.data.user.id);
      const tokenA = regA.body.data.accessToken;

      // 2. Register User B
      const emailB = `logout_b_${crypto.randomUUID()}@example.com`;
      const regB = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'User B', email: emailB, password: 'Password123!' });
      createdUserIds.push(regB.body.data.user.id);
      const tokenB = regB.body.data.accessToken;

      // Both can access /me before logout
      const beforeMeA = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(beforeMeA.status).toBe(200);

      const beforeMeB = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(beforeMeB.status).toBe(200);

      // 3. User A logs out
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toBe('Logout successful');

      // 4. Sesi User A di database sekarang memiliki revokedAt
      const decodedA = jwt.decode(tokenA) as any;
      const dbSessionA = await prisma.authSession.findUnique({
        where: { tokenId: decodedA.jti },
      });
      expect(dbSessionA?.revokedAt).not.toBeNull();

      // 5. User A tries to use tokenA again -> 401 Unauthorized
      const afterMeA = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(afterMeA.status).toBe(401);
      expect(afterMeA.body.message).toContain('revoked');

      // 6. User B session remains unaffected and still works
      const afterMeB = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(afterMeB.status).toBe(200);
      expect(afterMeB.body.data.user.name).toBe('User B');
    });
  });

  describe('Health check endpoints preservation', () => {
    it('GET /api/v1/health still returns 200 OK', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/health/db still returns 200 OK with live database', async () => {
      const res = await request(app).get('/api/v1/health/db');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('connected');
    });
  });
});
