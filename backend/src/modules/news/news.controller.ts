import type { Request, Response } from 'express';
import { paginated, ok } from '../../utils/response';
import { getNewsArticles, getLocalitySentimentSummary } from './news.service';
import { query } from '../../config/db';

export async function handleGetNews(req: Request, res: Response): Promise<void> {
  const page  = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const locality  = typeof req.query.locality  === 'string' ? req.query.locality  : undefined;
  const sentiment = typeof req.query.sentiment === 'string' ? req.query.sentiment : undefined;

  const { articles, total } = await getNewsArticles({ locality, sentiment, page, limit });

  paginated(res, articles, {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  });
}

export async function handleGetSentimentSummary(_req: Request, res: Response): Promise<void> {
  const summary = await getLocalitySentimentSummary();
  ok(res, summary);
}

export async function handleTriggerFetch(_req: Request, res: Response): Promise<void> {
  const { runNewsFetch } = await import('../../jobs/fetchNews');
  runNewsFetch().catch((e: Error) => console.error('[News] Manual trigger error:', e.message));
  ok(res, { message: 'News fetch triggered' });
}

export async function handleGetLocalities(_req: Request, res: Response): Promise<void> {
  const rows = await query<{ locality: string; count: string }>(
    `SELECT unnest(localities) AS locality, COUNT(*) AS count
     FROM news_articles
     WHERE fetched_at > NOW() - INTERVAL '30 days'
     GROUP BY locality
     ORDER BY count DESC
     LIMIT 20`,
  );
  ok(res, rows.map((r) => ({ locality: r.locality, count: parseInt(r.count, 10) })));
}
