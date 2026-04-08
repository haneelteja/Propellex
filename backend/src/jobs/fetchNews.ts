import { query, pool } from '../config/db';

// ── RSS feed sources ──────────────────────────────────────────────────────────
const RSS_FEEDS = [
  {
    url: 'https://economictimes.indiatimes.com/industry/services/property-/-cii/rss.cms',
    source: 'Economic Times',
  },
  {
    url: 'https://www.thehindu.com/business/Economy/?service=rss',
    source: 'The Hindu Business',
  },
  {
    url: 'https://housing.com/news/feed/',
    source: 'Housing.com',
  },
  {
    url: 'https://www.magicbricks.com/blog/feed/',
    source: 'MagicBricks',
  },
];

// ── Hyderabad localities for tagging ─────────────────────────────────────────
const LOCALITIES = [
  'jubilee hills', 'banjara hills', 'gachibowli', 'kondapur', 'kokapet',
  'hitech city', 'hi-tech city', 'hitec city', 'madhapur', 'nanakramguda',
  'financial district', 'kukatpally', 'miyapur', 'bachupally', 'kompally',
  'begumpet', 'secunderabad', 'ameerpet', 'sr nagar', 'manikonda',
  'tolichowki', 'attapur', 'mehdipatnam', 'uppal', 'lb nagar',
];

// ── Sentiment keywords ────────────────────────────────────────────────────────
const POSITIVE_TERMS = [
  'growth', 'appreciation', 'record', 'rise', 'surge', 'boom', 'investment',
  'returns', 'profitable', 'demand', 'launch', 'approved', 'attract', 'rally',
  'rebound', 'strong', 'benefit', 'opportunity', 'expand', 'milestone',
];
const NEGATIVE_TERMS = [
  'decline', 'crash', 'fall', 'slowdown', 'delay', 'fraud', 'penalty',
  'illegal', 'demolition', 'default', 'dispute', 'drop', 'decrease',
  'concern', 'risk', 'warning', 'loss', 'violation', 'cancelled', 'cancel',
];

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const posScore = POSITIVE_TERMS.filter((t) => lower.includes(t)).length;
  const negScore = NEGATIVE_TERMS.filter((t) => lower.includes(t)).length;
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

function detectLocalities(text: string): string[] {
  const lower = text.toLowerCase();
  const found = LOCALITIES.filter((loc) => lower.includes(loc));
  // Normalise variants
  return [...new Set(found.map((l) => l.replace('hi-tech city', 'hitech city').replace('hitec city', 'hitech city')))];
}

// ── Minimal RSS XML parser (no dependencies) ─────────────────────────────────
interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
    ?? xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m?.[1]?.trim() ?? '';
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    items.push({
      title:       extractTag(block, 'title'),
      link:        extractTag(block, 'link'),
      description: extractTag(block, 'description'),
      pubDate:     extractTag(block, 'pubDate'),
    });
  }
  return items;
}

// Strip HTML tags from description
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
}

// ── Core fetch function ───────────────────────────────────────────────────────
async function fetchFeed(feed: { url: string; source: string }): Promise<number> {
  let xml: string;
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'Propellex-NewsBot/1.0' },
    });
    if (!res.ok) {
      console.warn(`[News] ${feed.source}: HTTP ${res.status} — skipping`);
      return 0;
    }
    xml = await res.text();
  } catch (e: unknown) {
    console.warn(`[News] ${feed.source}: fetch failed — ${(e as Error).message}`);
    return 0;
  }

  const items = parseRss(xml);
  let saved = 0;

  for (const item of items) {
    if (!item.title || !item.link) continue;

    const text = `${item.title} ${item.description}`;
    const sentiment = detectSentiment(text);
    const localities = detectLocalities(text);

    // Only store articles relevant to real estate or Hyderabad
    const isRelevant =
      localities.length > 0 ||
      /real estate|property|realty|housing|hyderabad|telangana|apartment|villa|plot/i.test(text);
    if (!isRelevant) continue;

    const pubDate = item.pubDate ? new Date(item.pubDate) : null;
    const summary = stripHtml(item.description) || null;

    try {
      await query(
        `INSERT INTO news_articles (title, summary, url, source, published_at, sentiment, localities)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (url) DO NOTHING`,
        [item.title.slice(0, 400), summary, item.link.slice(0, 1000), feed.source, pubDate, sentiment, localities],
      );
      saved++;
    } catch (e: unknown) {
      const err = e as Error & { code?: string };
      console.error(`[News] DB insert failed — code:`, err.code, '| message:', err.message);
    }
  }

  return saved;
}

// ── Public job function ───────────────────────────────────────────────────────
export async function runNewsFetch(): Promise<void> {
  console.info('[News] Starting RSS fetch...');

  let total = 0;
  for (const feed of RSS_FEEDS) {
    const count = await fetchFeed(feed);
    console.info(`[News] ${feed.source}: saved ${count} articles`);
    total += count;
    await new Promise((r) => setTimeout(r, 2_000)); // 2s between feeds — polite
  }

  // Prune articles older than 30 days to keep the table lean
  try {
    const pruneResult = await pool.query(
      `DELETE FROM news_articles WHERE fetched_at < NOW() - INTERVAL '30 days'`,
    );
    if ((pruneResult.rowCount ?? 0) > 0) console.info(`[News] Pruned ${pruneResult.rowCount} old articles`);
  } catch (e: unknown) {
    console.warn('[News] Prune failed:', (e as Error).message);
  }

  console.info(`[News] Fetch complete — ${total} new articles saved`);
}

/** Schedule news fetching every 4 hours, first run 2 min after startup. */
export function scheduleNewsFetch(): void {
  const INITIAL_DELAY_MS = 2 * 60_000;
  const INTERVAL_MS = 4 * 60 * 60_000;

  setTimeout(() => {
    runNewsFetch().catch((e) => console.error('[News] Unhandled error:', e));
    setInterval(() => {
      runNewsFetch().catch((e) => console.error('[News] Unhandled error:', e));
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.info('[News] RSS fetch scheduled (first run in 2 min, then every 4 h)');
}
