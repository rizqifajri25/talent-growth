import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

/**
 * Basic API health check
 * Verifies that the HTTP server is running and accepting requests.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Talent Growth API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Diagnostic database health check
 * Attempts a simple query (SELECT 1) using Prisma Client.
 * Returns 200 if connected, 503 if unavailable or unconfigured.
 * Note: Evaluate before exposing in public production deployments.
 */
router.get('/health/db', async (_req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured or unavailable',
        status: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    // Simple connectivity probe
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      status: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Safely log failure on server side without exposing credentials or stack to client
    const errorMsg = error instanceof Error ? error.message : 'Unknown database connection error';
    console.error('⚠️ Database health check probe failed:', errorMsg);

    return res.status(503).json({
      success: false,
      message: 'Database is currently unreachable',
      status: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
