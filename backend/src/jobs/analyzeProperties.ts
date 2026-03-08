import { getAllActivePropertyIds, analyzePropertyWithAI } from '../modules/property/property.service';

const DELAY_BETWEEN_PROPERTIES_MS = 3000; // 3s between calls to avoid rate limits

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runDailyAnalysis(): Promise<void> {
  console.info('[Cron] Starting daily property AI analysis...');

  let ids: string[];
  try {
    ids = await getAllActivePropertyIds();
  } catch (err) {
    console.error('[Cron] Failed to fetch property IDs:', err);
    return;
  }

  console.info(`[Cron] Analyzing ${ids.length} properties`);
  let success = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      await analyzePropertyWithAI(id);
      success++;
    } catch (err) {
      console.error(`[Cron] Failed to analyze property ${id}:`, (err as Error).message);
      failed++;
    }
    await sleep(DELAY_BETWEEN_PROPERTIES_MS);
  }

  console.info(`[Cron] Daily analysis complete — ${success} succeeded, ${failed} failed`);
}

/** Schedule daily analysis using native Node.js timers.
 *  Runs once at startup (after INITIAL_DELAY_MS) then every 24 hours. */
export function scheduleDailyAnalysis() {
  const INITIAL_DELAY_MS = 60_000;        // 1 minute after startup
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  setTimeout(() => {
    runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    setInterval(() => {
      runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.info('[Cron] Daily property analysis scheduled (first run in 1 min)');
}
