/**
 * Run all SQL migration files in /migrations in filename order.
 * Safe to run multiple times — uses IF NOT EXISTS / IF EXISTS guards.
 *
 * Usage:  npm run migrate
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.info(`[Migrate] Found ${files.length} migration files`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.info(`[Migrate] Running ${file}...`);
    try {
      await pool.query(sql);
      console.info(`[Migrate] ${file} — OK`);
    } catch (err) {
      const e = err as Error & { code?: string };
      console.error(`[Migrate] ${file} — FAILED: ${e.code} ${e.message}`);
      process.exit(1);
    }
  }

  console.info('[Migrate] All migrations complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[Migrate] Fatal:', err);
  process.exit(1);
});
