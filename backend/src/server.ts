import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { collectDefaultMetrics } from 'prom-client';
import { requestLogger, logger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { connectRedis, closeRedis } from './config/redis';
import { getPool, closePool } from './config/db';
import { healthRouter } from './routes/health';
import { ordersRouter } from './routes/orders';
import { productsRouter } from './routes/products';
import { customersRouter } from './routes/customers';

// Collect Node.js default metrics (event loop lag, GC, memory)
collectDefaultMetrics({ prefix: 'propellex_' });

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// ── Observability ─────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Health / metrics (no rate limit) ─────────────────────────────────────────
app.use(healthRouter);

// ── Rate limiting on all API routes ──────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectRedis();
    logger.info('Redis connected');

    await getPool();
    logger.info('SQL Server pool ready');

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Propellex API running');
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down gracefully...');
      server.close(async () => {
        await Promise.allSettled([closeRedis(), closePool()]);
        logger.info('All connections closed. Goodbye.');
        process.exit(0);
      });

      // Force exit after 15s if connections don't close
      setTimeout(() => process.exit(1), 15_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled promise rejection');
    });
    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception — shutting down');
      process.exit(1);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
