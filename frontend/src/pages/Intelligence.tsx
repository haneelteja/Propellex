import { useState } from 'react';
import { useNews, useLocalitySentiment, useNewsLocalities } from '@/hooks/useNews';
import type { NewsSentiment } from '@/types';

const SENTIMENT_COLORS: Record<NewsSentiment, string> = {
  positive: 'text-secondary border-secondary bg-secondary/10',
  negative:  'text-error border-error bg-error/10',
  neutral:   'text-on-surface-variant border-outline-variant bg-surface-container',
};

const SENTIMENT_ICONS: Record<NewsSentiment, string> = {
  positive: 'trending_up',
  negative:  'trending_down',
  neutral:   'trending_flat',
};

function SentimentBadge({ sentiment }: { sentiment: NewsSentiment }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border font-label text-[10px] uppercase tracking-widest ${SENTIMENT_COLORS[sentiment]}`}>
      <span className="material-symbols-outlined text-[12px] leading-none">{SENTIMENT_ICONS[sentiment]}</span>
      {sentiment}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ALL_LOCALITIES = [
  'jubilee hills', 'banjara hills', 'gachibowli', 'kondapur', 'kokapet',
  'hitech city', 'madhapur', 'nanakramguda', 'financial district',
  'kukatpally', 'miyapur', 'begumpet', 'secunderabad',
];

export default function Intelligence() {
  const [localityFilter, setLocalityFilter] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { articles, pagination, isLoading, isFetching } = useNews({
    locality:  localityFilter || undefined,
    sentiment: sentimentFilter || undefined,
    page,
    limit: 15,
  });

  const { data: sentimentMap } = useLocalitySentiment();
  const { data: topLocalities } = useNewsLocalities();

  const handleFilterChange = (key: 'locality' | 'sentiment', value: string) => {
    setPage(1);
    if (key === 'locality') setLocalityFilter(value);
    else setSentimentFilter(value);
  };

  const resultLabel = isFetching
    ? 'Loading...'
    : pagination
      ? `${pagination.total} Articles`
      : '0 Articles';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-24 px-8 pb-8 bg-surface-container-low border-b border-outline-variant">
        <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-3 block">
          Market Intelligence
        </span>
        <h1 className="font-headline text-4xl font-light text-on-surface mb-2">
          Hyderabad{' '}
          <span className="italic text-primary">Real Estate</span>{' '}
          News
        </h1>
        <p className="font-body text-sm text-on-surface-variant">
          Live news aggregated from top real estate sources — filtered for Hyderabad
        </p>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant p-6 space-y-8">

          {/* Sentiment filter */}
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              Sentiment
            </p>
            <div className="space-y-1.5">
              {(['', 'positive', 'negative', 'neutral'] as const).map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => handleFilterChange('sentiment', s)}
                  className={`w-full text-left font-label text-xs px-3 py-2 border transition-colors ${
                    sentimentFilter === s
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {s === '' ? 'All Sentiment' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Locality filter */}
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              Locality
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => handleFilterChange('locality', '')}
                className={`w-full text-left font-label text-xs px-3 py-2 border transition-colors ${
                  localityFilter === ''
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                All Localities
              </button>
              {(topLocalities ?? ALL_LOCALITIES.map((l) => ({ locality: l, count: 0 }))).slice(0, 12).map((item) => {
                const loc = typeof item === 'string' ? item : item.locality;
                const cnt = typeof item === 'string' ? 0 : item.count;
                return (
                  <button
                    key={loc}
                    onClick={() => handleFilterChange('locality', loc)}
                    className={`w-full text-left font-label text-xs px-3 py-2 border transition-colors flex items-center justify-between ${
                      localityFilter === loc
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    <span className="capitalize">{loc}</span>
                    {cnt > 0 && (
                      <span className="text-[10px] opacity-60">{cnt}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locality sentiment heat */}
          {sentimentMap && Object.keys(sentimentMap).length > 0 && (
            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                7-Day Mood
              </p>
              <div className="space-y-2">
                {Object.entries(sentimentMap)
                  .sort((a, b) => (b[1].positive - b[1].negative) - (a[1].positive - a[1].negative))
                  .slice(0, 6)
                  .map(([loc, counts]) => {
                    const total = counts.positive + counts.negative + counts.neutral || 1;
                    const posW = Math.round((counts.positive / total) * 100);
                    const negW = Math.round((counts.negative / total) * 100);
                    const netPositive = counts.positive >= counts.negative;
                    return (
                      <div key={loc}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-label text-[10px] text-on-surface-variant capitalize truncate max-w-[120px]">{loc}</span>
                          <span className={`font-label text-[10px] ${netPositive ? 'text-secondary' : 'text-error'}`}>
                            {netPositive ? '+' : ''}{counts.positive - counts.negative}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-high flex overflow-hidden">
                          <div className="h-full bg-secondary/60" style={{ width: `${posW}%` }} />
                          <div className="h-full bg-error/60" style={{ width: `${negW}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
              {resultLabel}
            </p>
            {(localityFilter || sentimentFilter) && (
              <button
                onClick={() => { setLocalityFilter(''); setSentimentFilter(''); setPage(1); }}
                className="font-label text-xs text-primary uppercase tracking-widest hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Articles */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container border border-outline-variant p-6 animate-pulse">
                  <div className="h-4 bg-surface-container-high w-3/4 mb-3" />
                  <div className="h-3 bg-surface-container-high w-full mb-2" />
                  <div className="h-3 bg-surface-container-high w-2/3" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/30 text-6xl mb-4">newspaper</span>
              <p className="font-headline text-xl text-on-surface-variant">No articles yet</p>
              <p className="font-body text-sm text-on-surface-variant/60 mt-2">
                The news feed runs every 4 hours. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-surface-container border border-outline-variant p-6 hover:border-primary/50 hover:bg-surface-container-high transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-headline text-base text-on-surface group-hover:text-primary transition-colors leading-snug flex-1">
                      {article.title}
                    </h3>
                    <SentimentBadge sentiment={article.sentiment} />
                  </div>

                  {article.summary && (
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {article.source}
                    </span>
                    <span className="font-label text-[10px] text-on-surface-variant/50">
                      {formatDate(article.published_at ?? article.fetched_at)}
                    </span>
                    {article.localities.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {article.localities.slice(0, 4).map((loc) => (
                          <span
                            key={loc}
                            className="font-label text-[10px] bg-primary/10 text-primary px-2 py-0.5 capitalize"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="ml-auto font-label text-[10px] text-on-surface-variant/40 group-hover:text-primary transition-colors flex items-center gap-1">
                      Read
                      <span className="material-symbols-outlined text-[12px] leading-none">arrow_outward</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-6 pt-10">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-on-surface-variant border border-outline-variant px-5 py-2.5 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
                Previous
              </button>
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-on-surface-variant border border-outline-variant px-5 py-2.5 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
