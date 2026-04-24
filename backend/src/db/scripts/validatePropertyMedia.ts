/**
 * Validates all photos and video_url values on every active property.
 * Runs THREE full rounds to confirm consistency. For each image: sends an HTTP
 * HEAD request — a non-200 response means the URL is broken or inaccessible.
 * For each video: calls the YouTube oEmbed API to confirm the video exists.
 *
 * Usage: npm run validate-media
 * Output: summary table + list of any invalid records per round.
 */
import 'dotenv/config';
import { pool } from '../../config/db';

const ROUNDS = 3;
const CONCURRENCY = 5;   // parallel HEAD checks per batch
const REQUEST_TIMEOUT = 15_000;

interface PropertyMedia {
  id: string;
  title: string;
  locality: string;
  photos: string[];
  video_url: string | null;
}

interface ValidationResult {
  propertyId: string;
  title: string;
  locality: string;
  invalidPhotos: string[];
  videoValid: boolean | null; // null means no video assigned
}

// ── Validation helpers ─────────────────────────────────────────────────────────

async function checkImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      headers: { 'User-Agent': 'PropellexValidator/1.0' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkVideoUrl(embedUrl: string): Promise<boolean> {
  try {
    // Extract video ID from embed URL: https://www.youtube.com/embed/{id}
    const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
    if (!videoId) return false;

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      headers: { 'User-Agent': 'PropellexValidator/1.0' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Process items in batches of `concurrency` to avoid hammering servers */
async function batchCheck<T>(
  items: T[],
  checkFn: (item: T) => Promise<boolean>,
  concurrency: number,
): Promise<boolean[]> {
  const results: boolean[] = new Array(items.length);
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(checkFn));
    batchResults.forEach((r, j) => { results[i + j] = r; });
  }
  return results;
}

// ── Main validation ────────────────────────────────────────────────────────────

async function validateRound(
  round: number,
  properties: PropertyMedia[],
): Promise<ValidationResult[]> {
  console.info(`\n${'═'.repeat(60)}`);
  console.info(`  ROUND ${round} — Validating ${properties.length} properties`);
  console.info(`${'═'.repeat(60)}`);

  const failures: ValidationResult[] = [];
  let photoChecks = 0;
  let photoFailed = 0;
  let videoChecks = 0;
  let videoFailed = 0;
  let noPhotos = 0;
  let noVideo = 0;

  for (const prop of properties) {
    const invalidPhotos: string[] = [];

    // ── Check photos ────────────────────────────────────────────────────────
    if (!prop.photos || prop.photos.length === 0) {
      noPhotos++;
      console.warn(`  [WARN] ${prop.id} "${prop.title.slice(0, 40)}" — NO PHOTOS`);
    } else {
      const results = await batchCheck(prop.photos, checkImageUrl, CONCURRENCY);
      prop.photos.forEach((url, i) => {
        photoChecks++;
        if (!results[i]) {
          invalidPhotos.push(url);
          photoFailed++;
        }
      });
    }

    // ── Check video ─────────────────────────────────────────────────────────
    let videoValid: boolean | null = null;
    if (prop.video_url) {
      videoChecks++;
      videoValid = await checkVideoUrl(prop.video_url);
      if (!videoValid) videoFailed++;
    } else {
      noVideo++;
    }

    if (invalidPhotos.length > 0 || videoValid === false) {
      failures.push({
        propertyId: prop.id,
        title: prop.title,
        locality: prop.locality,
        invalidPhotos,
        videoValid,
      });
    }
  }

  // ── Round summary ──────────────────────────────────────────────────────────
  console.info(`\n  Photos : ${photoChecks - photoFailed}/${photoChecks} OK  (${photoFailed} broken)`);
  console.info(`  Videos : ${videoChecks - videoFailed}/${videoChecks} OK  (${videoFailed} broken, ${noVideo} missing)`);
  console.info(`  Properties missing photos: ${noPhotos}`);
  console.info(`  Properties with failures : ${failures.length}`);

  if (failures.length > 0) {
    console.info('\n  Failed properties:');
    for (const f of failures) {
      console.info(`    • [${f.locality}] ${f.title.slice(0, 50)}`);
      if (f.invalidPhotos.length > 0) {
        console.info(`      Broken photos (${f.invalidPhotos.length}):`);
        f.invalidPhotos.forEach((u) => console.info(`        - ${u}`));
      }
      if (f.videoValid === false) {
        console.info(`      Broken video: ${properties.find((p) => p.id === f.propertyId)?.video_url}`);
      }
    }
  } else {
    console.info('\n  ✓ All records passed this round.');
  }

  return failures;
}

async function run() {
  const { rows } = await pool.query<PropertyMedia>(
    `SELECT id, title, locality,
            COALESCE(photos, '[]'::jsonb) AS photos,
            video_url
     FROM properties
     WHERE is_active = true
     ORDER BY locality, title`,
  );

  console.info(`[Validate] Loaded ${rows.length} active properties`);
  console.info(`[Validate] Running ${ROUNDS} validation rounds\n`);

  // Coerce photos from JSONB (pg returns already-parsed arrays)
  const props: PropertyMedia[] = rows.map((r) => ({
    ...r,
    photos: Array.isArray(r.photos) ? r.photos as unknown as string[] : [],
  }));

  const roundResults: { round: number; failures: number }[] = [];

  for (let round = 1; round <= ROUNDS; round++) {
    const failures = await validateRound(round, props);
    roundResults.push({ round, failures: failures.length });

    if (round < ROUNDS) {
      console.info('\n  Waiting 3 s before next round...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // ── Final report ───────────────────────────────────────────────────────────
  console.info(`\n${'═'.repeat(60)}`);
  console.info('  FINAL REPORT');
  console.info(`${'═'.repeat(60)}`);
  for (const { round, failures } of roundResults) {
    const status = failures === 0 ? '✓ PASS' : `✗ FAIL (${failures} properties)`;
    console.info(`  Round ${round}: ${status}`);
  }

  const totalFailed = roundResults.reduce((s, r) => s + r.failures, 0);
  if (totalFailed === 0) {
    console.info('\n  ✓ ALL THREE ROUNDS PASSED — media data is valid and consistent.\n');
  } else {
    console.info('\n  ✗ Some failures detected. Re-run npm run update-media to replace broken URLs.\n');
    process.exit(1);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('[Validate] Fatal:', err);
  process.exit(1);
});
