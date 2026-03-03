import { Router } from 'express';
import { register } from 'prom-client';
import { getPool } from '../config/db';
import { redis } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Redis check
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  // SQL Server check
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS alive');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Prometheus metrics endpoint
healthRouter.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
