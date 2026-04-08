import { query } from '../../config/db';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  published_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  localities: string[];
  fetched_at: string;
}

interface NewsFilters {
  locality?: string;
  sentiment?: string;
  page: number;
  limit: number;
}

export async function getNewsArticles(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.locality) {
    conditions.push(`$${idx} = ANY(localities)`);
    params.push(filters.locality.toLowerCase());
    idx++;
  }

  if (filters.sentiment && ['positive', 'negative', 'neutral'].includes(filters.sentiment)) {
    conditions.push(`sentiment = $${idx}`);
    params.push(filters.sentiment);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM news_articles ${where}`,
    params,
  );
  const total = parseInt(countResult[0]?.count ?? '0', 10);

  const offset = (filters.page - 1) * filters.limit;
  const articles = await query<NewsArticle>(
    `SELECT id, title, summary, url, source, published_at, sentiment, localities, fetched_at
     FROM news_articles
     ${where}
     ORDER BY COALESCE(published_at, fetched_at) DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset],
  );

  return { articles, total };
}

export async function getLocalitySentimentSummary(): Promise<Record<string, { positive: number; negative: number; neutral: number }>> {
  const rows = await query<{ locality: string; sentiment: string; count: string }>(
    `SELECT unnest(localities) AS locality, sentiment, COUNT(*) AS count
     FROM news_articles
     WHERE fetched_at > NOW() - INTERVAL '7 days'
     GROUP BY locality, sentiment`,
  );

  const result: Record<string, { positive: number; negative: number; neutral: number }> = {};
  for (const row of rows) {
    if (!result[row.locality]) result[row.locality] = { positive: 0, negative: 0, neutral: 0 };
    result[row.locality]![row.sentiment as 'positive' | 'negative' | 'neutral'] += parseInt(row.count, 10);
  }
  return result;
}
