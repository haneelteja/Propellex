import { getPropertiesNeedingAnalysis, analyzePropertyWithAI } from '../modules/property/property.service';
import { redis } from '../config/redis';

const DELAY_BETWEEN_PROPERTIES_MS = 10_000; // 10s between calls → 6 RPM, leaves headroom for on-demand compare calls
const LOCK_KEY = 'cron:analysis:lock';
const LOCK_TTL_S = 90 * 60; // 90-minute TTL — enough for a full 184-property batch at 10s each (~30 min)

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

  // Prevent concurrent runs (e.g. manual trigger overlapping with scheduled cron)
  const lockAcquired = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL_S, 'NX');
  if (!lockAcquired) {
    console.info('[Cron] Analysis already in progress — skipping this run.');
    return;
  }

  let ids: string[];
  try {
    ids = await getPropertiesNeedingAnalysis();
  } catch (err) {
    await redis.del(LOCK_KEY);
    console.error('[Cron] Failed to fetch property IDs:', err);
    return;
  }

  if (ids.length === 0) {
    console.info('[Cron] All properties already analyzed — nothing to do.');
    await redis.del(LOCK_KEY);
    return;
  }
  console.info(`[Cron] Analyzing ${ids.length} properties (unanalyzed or stale)`);
  let success = 0;
  let failed = 0;

  try {
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
        if (msg.includes('Too Many Requests') || msg.includes('429')) {
          // Distinguish transient rate limit (per-minute) from quota exhaustion (daily cap).
          // Quota exhaustion messages contain "quota" or "billing"; these won't recover
          // in an hour, so abort immediately and let the next 6-hour cron pick up.
          const isQuotaExhausted = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing');
          if (isQuotaExhausted) {
            console.warn(`[Cron] Gemini daily quota exhausted — aborting batch. ${success} analyzed so far. Will resume next cron run.`);
            failed++;
            break;
          }
          // Transient per-minute rate limit — wait 60s then retry once
          console.warn('[Cron] Gemini rate limit hit — waiting 60s before retry.');
          await sleep(60_000);
          console.info('[Cron] Resuming after rate-limit backoff...');
          try {
            await analyzePropertyWithAI(id);
            success++;
          } catch {
            failed++;
            console.warn('[Cron] Still rate-limited after 60s — aborting batch.');
            break;
          }
          continue;
        }
        failed++;
      }
      await sleep(DELAY_BETWEEN_PROPERTIES_MS);
    }
  } finally {
    await redis.del(LOCK_KEY);
  }

  console.info(`[Cron] Analysis complete — ${success} succeeded, ${failed} failed`);
}

/** Release the analysis lock — call this from the SIGTERM/SIGINT shutdown handler
 *  so a Render instance restart doesn't leave a stale lock for 90 minutes. */
export async function releaseAnalysisLock(): Promise<void> {
  await redis.del(LOCK_KEY).catch(() => {/* best-effort */});
}

/** Schedule analysis using native Node.js timers.
 *  Runs once at startup (after INITIAL_DELAY_MS) then every 6 hours. */
export function scheduleDailyAnalysis() {
  const INITIAL_DELAY_MS = 10 * 60_000;      // 10 minutes after startup (avoids hitting quota right after restart)
  const INTERVAL_MS = 6 * 60 * 60 * 1000;   // every 6 hours

  setTimeout(() => {
    runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    setInterval(() => {
      runDailyAnalysis().catch((err) => console.error('[Cron] Unhandled error:', err));
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.info('[Cron] Property analysis scheduled (first run in 10 min, then every 6 hours)');
}
