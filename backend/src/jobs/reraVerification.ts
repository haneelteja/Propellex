import { query } from '../config/db';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const DELAY_MS = 10_000; // 10s between properties — RERA portal is slow

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface ReraResult {
  rera_number: string | null;
  rera_status: 'verified' | 'pending' | 'not_registered' | 'unknown';
}

async function verifyPropertyRera(propertyId: string, reraNumber: string | null): Promise<ReraResult | null> {
  if (!AI_SERVICE_URL) return null;

  try {
    const res = await fetch(`${AI_SERVICE_URL}/rera/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId, rera_number: reraNumber }),
      signal: AbortSignal.timeout(60_000), // RERA portal can be slow
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (text.trimStart().startsWith('<')) {
        console.warn(`[RERA] AI service unavailable (HTTP ${res.status})`);
        return null;
      }
      console.warn(`[RERA] AI service error ${res.status} for property ${propertyId}`);
      return null;
    }

    const data = (await res.json()) as { rera_number: string | null; rera_status: string };
    return {
      rera_number: data.rera_number ?? null,
      rera_status: (data.rera_status as ReraResult['rera_status']) ?? 'unknown',
    };
  } catch (e: unknown) {
    console.warn(`[RERA] Fetch failed for property ${propertyId}:`, (e as Error).message);
    return null;
  }
}

async function updateReraStatus(propertyId: string, result: ReraResult): Promise<void> {
  const err_handler = (e: unknown) => {
    const err = e as Error & { code?: string };
    console.error('[RERA] DB update failed — code:', err.code, '| message:', err.message);
  };

  await query(
    `UPDATE properties
     SET rera_number = $1, rera_status = $2, rera_verified_at = NOW()
     WHERE id = $3`,
    [result.rera_number, result.rera_status, propertyId],
  ).catch(err_handler);
}

export async function runReraVerification(): Promise<void> {
  console.info('[RERA] Starting nightly RERA verification...');

  if (!AI_SERVICE_URL) {
    console.warn('[RERA] AI_SERVICE_URL not set — skipping RERA verification');
    return;
  }

  // Fetch properties that need verification: never verified or verified > 7 days ago
  let properties: { id: string; rera_number: string | null }[];
  try {
    properties = await query<{ id: string; rera_number: string | null }>(
      `SELECT id, rera_number FROM properties
       WHERE rera_verified_at IS NULL
          OR rera_verified_at < NOW() - INTERVAL '7 days'
       ORDER BY rera_verified_at ASC NULLS FIRST
       LIMIT 20`,
    );
  } catch (e: unknown) {
    console.error('[RERA] Failed to fetch property IDs:', (e as Error).message);
    return;
  }

  if (properties.length === 0) {
    console.info('[RERA] All properties recently verified — nothing to do');
    return;
  }

  console.info(`[RERA] Verifying ${properties.length} properties`);
  let success = 0;
  let failed = 0;

  for (const prop of properties) {
    const result = await verifyPropertyRera(prop.id, prop.rera_number);
    if (result) {
      await updateReraStatus(prop.id, result);
      success++;
    } else {
      // Mark as unknown with a timestamp so it's not re-attempted immediately
      await updateReraStatus(prop.id, { rera_number: prop.rera_number, rera_status: 'unknown' });
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.info(`[RERA] Verification complete — ${success} verified, ${failed} failed/unknown`);
}

/** Schedule RERA verification nightly at ~2 AM (12h after startup, then every 24h). */
export function scheduleReraVerification(): void {
  const INITIAL_DELAY_MS = 12 * 60 * 60_000; // 12h after startup
  const INTERVAL_MS      = 24 * 60 * 60_000; // every 24h

  setTimeout(() => {
    runReraVerification().catch((e) => console.error('[RERA] Unhandled error:', e));
    setInterval(() => {
      runReraVerification().catch((e) => console.error('[RERA] Unhandled error:', e));
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.info('[RERA] Verification scheduled (first run in 12 h, then every 24 h)');
}
