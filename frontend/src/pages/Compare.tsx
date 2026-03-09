import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { properties as propertiesApi } from '@/services/api';
import { formatRupeesCr } from '@/lib/utils';
import { Skeleton } from '@/components/shared/Skeleton';
import type { Property, CompareResult, PropertyRating } from '@/types';

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? 'bg-green-100 text-green-700' :
    score >= 6 ? 'bg-blue-100 text-blue-700' :
    score >= 4 ? 'bg-yellow-100 text-yellow-700' :
                 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${color}`}>
      {score}
    </span>
  );
}

// ── Star rating bar ───────────────────────────────────────────────────────────

function RatingBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{score}/10</span>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────

function CompareRow({
  label,
  values,
  highlight,
}: {
  label: string;
  values: (string | number | null | undefined)[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}>
      <td className="py-3 px-4 text-xs font-medium text-gray-500 w-32 border-r border-gray-100 sticky left-0 bg-white">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-4 text-sm text-gray-800 text-center">
          {v != null && v !== '' ? String(v) : <span className="text-gray-300">—</span>}
        </td>
      ))}
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Compare() {
  const [params] = useSearchParams();
  const ids = useMemo(() => {
    const raw = params.get('ids') ?? '';
    return raw.split(',').filter(Boolean).slice(0, 4);
  }, [params]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => propertiesApi.compare(ids),
    enabled: ids.length >= 2,
    staleTime: 5 * 60_000,
  });

  if (ids.length < 2) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-sm">Select at least 2 properties to compare.</p>
        <Link to="/search" className="mt-4 inline-block text-brand text-sm font-medium hover:underline">
          ← Go to Search
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-sm">Failed to load comparison. Please try again.</p>
        <Link to="/search" className="mt-4 inline-block text-brand text-sm font-medium hover:underline">
          ← Go to Search
        </Link>
      </div>
    );
  }

  const { properties, ai_comparison } = data;
  const count = properties.length;

  // Build a rating map for quick lookup
  const ratingMap = new Map<string, PropertyRating>(
    ai_comparison.ratings.map((r) => [r.id, r]),
  );

  const bestProp = properties.find((p) => p.id === ai_comparison.best_pick_id);

  // Helper: get display value per property for each attribute
  const vals = <T,>(fn: (p: Property) => T) => properties.map(fn);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Property Comparison</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered side-by-side analysis of {count} properties</p>
        </div>
        <Link to="/search" className="text-sm text-brand hover:text-navy font-medium flex items-center gap-1">
          ← Back to Search
        </Link>
      </div>

      {/* Property header cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${count}, 1fr)` }}>
        <div /> {/* empty corner */}
        {properties.map((p) => {
          const rating = ratingMap.get(p.id);
          const isBest = p.id === ai_comparison.best_pick_id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 ${
                isBest ? 'border-brand ring-2 ring-brand/30' : 'border-gray-200'
              }`}
            >
              {isBest && (
                <span className="self-start text-xs font-semibold bg-brand text-white px-2 py-0.5 rounded-full">
                  Best Pick
                </span>
              )}
              <div className="h-28 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={p.photos?.[0] ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Link
                  to={`/property/${p.id}`}
                  className="text-sm font-semibold text-navy line-clamp-2 hover:underline leading-snug"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">{p.locality}, {p.city}</p>
              </div>
              {rating && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={rating.overall_score} />
                    <span className="text-xs text-gray-500">AI Score</span>
                  </div>
                  <RatingBar score={rating.overall_score} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left w-32 sticky left-0 bg-gray-50 border-r border-gray-200">
                Attribute
              </th>
              {properties.map((p) => (
                <th key={p.id} className="py-3 px-4 text-xs font-semibold text-gray-700 text-center">
                  {p.locality}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <CompareRow
              label="Price"
              highlight
              values={vals((p) => formatRupeesCr(p.price))}
            />
            <CompareRow
              label="Price/sqft"
              values={vals((p) => `₹${Math.round(p.price_per_sqft / 100).toLocaleString('en-IN')}`)}
            />
            <CompareRow
              label="Area"
              values={vals((p) => `${p.area_sqft.toLocaleString('en-IN')} sqft`)}
            />
            <CompareRow
              label="Type"
              values={vals((p) => p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1))}
            />
            <CompareRow
              label="Status"
              values={vals((p) => p.status === 'ready_to_move' ? 'Ready to Move' : 'Under Construction')}
            />
            <CompareRow
              label="Bedrooms"
              values={vals((p) => p.bedrooms ?? '—')}
            />
            <CompareRow
              label="Bathrooms"
              values={vals((p) => p.bathrooms ?? '—')}
            />
            <CompareRow
              label="Builder"
              values={vals((p) => p.builder_name || '—')}
            />
            <CompareRow
              label="RERA Status"
              highlight
              values={vals((p) => p.rera_status.charAt(0).toUpperCase() + p.rera_status.slice(1))}
            />
            <CompareRow
              label="3yr ROI Est."
              highlight
              values={vals((p) => `${p.roi_estimate_3yr}%`)}
            />
            <CompareRow
              label="Risk Score"
              values={vals((p) => `${p.risk_score}/100`)}
            />
            <CompareRow
              label="Locality"
              values={vals((p) => p.locality)}
            />
          </tbody>
        </table>
      </div>

      {/* AI Strengths & Weaknesses per property */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-4">AI Assessment per Property</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
          {properties.map((p) => {
            const rating = ratingMap.get(p.id);
            const isBest = p.id === ai_comparison.best_pick_id;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 ${
                  isBest ? 'border-brand' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-navy line-clamp-1 flex-1">{p.title}</p>
                  {isBest && (
                    <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full flex-shrink-0">Best</span>
                  )}
                </div>
                {rating ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1.5">Strengths</p>
                      <ul className="space-y-1">
                        {rating.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1.5">Weaknesses</p>
                      <ul className="space-y-1">
                        {rating.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">No AI assessment available</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Summary */}
      <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.5 3.5 0 01-4.950 0l-.347-.347z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">AI Recommendation</h2>
        </div>

        {bestProp && (
          <div className="bg-white/10 rounded-xl p-4 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white/20">
              <img
                src={bestProp.photos?.[0] ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'}
                alt={bestProp.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-0.5">Best Pick</p>
              <p className="font-semibold">{bestProp.title}</p>
              <p className="text-sm text-white/80 mt-0.5">{bestProp.locality} · {formatRupeesCr(bestProp.price)}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              {ratingMap.get(bestProp.id) && (
                <span className="text-3xl font-bold text-white/90">
                  {ratingMap.get(bestProp.id)!.overall_score}<span className="text-sm text-white/50">/10</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm text-white/80 leading-relaxed">
          <p className="text-white font-medium">{ai_comparison.best_pick_reason}</p>
          <p>{ai_comparison.summary}</p>
        </div>

        <div className="pt-1">
          {bestProp && (
            <Link
              to={`/property/${bestProp.id}`}
              className="inline-flex items-center gap-2 bg-gold text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
            >
              View {bestProp.locality} Property →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
