import sql from 'mssql';
import { logger } from '../middleware/requestLogger';

const poolConfig: sql.config = {
  server: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  database: process.env.DB_NAME ?? 'propellex',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30_000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    enableArithAbort: true,
    requestTimeout: 15_000,
    connectTimeout: 15_000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(poolConfig)
      .connect()
      .then((pool) => {
        logger.info('SQL Server connection pool established');
        pool.on('error', (err: Error) => {
          logger.error({ err }, 'SQL Server pool error');
          poolPromise = null; // allow reconnect on next call
        });
        return pool;
      })
      .catch((err: Error) => {
        logger.error({ err }, 'Failed to connect to SQL Server');
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    logger.info('SQL Server pool closed');
  }
}

export { sql };
