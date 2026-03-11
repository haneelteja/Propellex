import { getPropertiesNeedingAnalysis, analyzePropertyWithAI } from '../modules/property/property.service';

const DELAY_BETWEEN_PROPERTIES_MS = 5000; // 5s between calls → ~12 RPM, under Gemini free tier 15 RPM limit

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runDailyAnalysis(): Promise<void> {
  console.info('[Cron] Starting daily property AI analysis...');

  // Skip if AI service URL is not configured
  if (!process.env.AI_SERVICE_URL) {
    console.warn('[Cron] AI_SERVICE_URL not set — skipping AI analysis.');
    return;
  }

  let ids: string[];
  try {
    ids = await getPropertiesNeedingAnalysis();
  } catch (err) {
    console.error('[Cron] Failed to fetch property IDs:', err);
    return;
  }

  if (ids.length === 0) {
    console.info('[Cron] All properties already analyzed — nothing to do.');
    return;
  }
  console.info(`[Cron] Analyzing ${ids.length} properties (unanalyzed or stale)`);
  let success = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      await analyzePropertyWithAI(id);
      success++;
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[Cron] Failed to analyze property ${id}:`, msg);
      // If AI service is unreachable (returns HTML error page), abort — no point
      // hammering all 50 properties and filling logs with the same error.
      if (msg.includes('service unavailable')) {
        console.warn('[Cron] AI service appears to be down — aborting batch.');
        break;
      }
      failed++;
    }
    await sleep(DELAY_BETWEEN_PROPERTIES_MS);
  }

  console.info(`[Cron] Analysis complete — ${success} succeeded, ${failed} failed`);
}

/** Schedule analysis using native Node.js timers.
 *  Runs once at startup (after INITIAL_DELAY_MS) then every 6 hours. */
export function scheduleDailyAnalysis() {
  const INITIAL_DELAY_MS = 60_000;           // 1 minute after startup
  const INTERVAL_MS = 6 * 60 * 60 * 1000;   // every 6 hours

  setTimeout(() => {
    runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    setInterval(() => {
      runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.info('[Cron] Property analysis scheduled (first run in 1 min, then every 6 hours)');
}
