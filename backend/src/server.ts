import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectRedis, closeRedis } from './config/redis';
import { pool } from './config/db';
import { errorHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { propertyRouter } from './modules/property/property.routes';
import { portfolioRouter } from './modules/portfolio/portfolio.routes';
import { recommendationsRouter } from './modules/recommendations/recommendations.routes';
import { chatRouter } from './modules/chat/chat.routes';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Allow multiple origins: local dev + deployed Vercel frontend
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Render health checks, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = {};
  try { await pool.query('SELECT 1'); checks.postgres = 'ok'; } catch { checks.postgres = 'error'; }
  const healthy = Object.values(checks).every((v) => v === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/chat', chatRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectRedis();
  } catch (err) {
    console.warn('[Server] Redis unavailable — freemium limits disabled:', (err as Error).message);
  }

  // Test DB connection at startup so we know immediately if Neon is reachable
  try {
    const client = await pool.connect();
    console.info('[DB] Startup connection test: SUCCESS');
    client.release();
  } catch (err: unknown) {
    const e = err as Error & { errors?: Error[]; code?: string };
    console.error('[DB] Startup connection test: FAILED');
    console.error('[DB] Error name:', e.name, '| code:', e.code, '| message:', e.message);
    if (e.errors?.length) {
      e.errors.forEach((sub, i) => console.error(`[DB]   sub[${i}]:`, sub.message));
    }
    // Continue starting — the error will surface per-request too
  }

  const server = app.listen(PORT, () => {
    console.info(`[Server] Propellex API running on :${PORT} (${process.env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.info(`[Server] ${signal} received — shutting down`);
    server.close(async () => {
      await Promise.allSettled([closeRedis(), pool.end()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (r) => console.error('[Server] Unhandled rejection:', r));
}

start().catch((err) => { console.error('[Server] Startup failed:', err); process.exit(1); });
