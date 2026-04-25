/**
 * Clears ai_analysis and ai_analyzed_at on all active properties so the
 * next cron run re-analyzes every property with the updated scoring rubric.
 * Run with: npm run reset-analysis
 */
import 'dotenv/config';
import { pool } from '../../config/db';

async function run() {
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE properties
       SET ai_analysis = NULL, ai_analyzed_at = NULL
       WHERE is_active = true`,
    );
    console.info(`[Reset] Cleared analysis data for ${rowCount} properties — cron will re-analyze on next run.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[Reset] Fatal error:', err);
  process.exit(1);
});
