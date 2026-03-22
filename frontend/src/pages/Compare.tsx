import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { properties as propertiesApi } from '@/services/api';
import { formatRupeesCr } from '@/lib/utils';
import { Skeleton } from '@/components/shared/Skeleton';
import type { Property, PropertyRating } from '@/types';

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? 'bg-secondary/20 text-secondary' :
    score >= 6 ? 'bg-primary/20 text-primary' :
    score >= 4 ? 'bg-on-surface-variant/20 text-on-surface-variant' :
                 'bg-error/20 text-error';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${color}`}>
      {score}
    </span>
  );
}

// ── Rating bar ────────────────────────────────────────────────────────────────

function RatingBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? 'bg-secondary' : score >= 6 ? 'bg-primary' : 'bg-error';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-surface-container-high overflow-hidden">
        {/* width set via inline style — JIT w-[N%] is not reliable for dynamic values */}
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-on-surface-variant w-8 text-right">{score}/10</span>
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
    <tr className={highlight ? 'bg-primary/5' : 'hover:bg-surface-container-low/50'}>
      <td className="py-3 px-4 text-xs font-medium text-on-surface-variant w-32 border-r border-outline-variant sticky left-0 bg-surface-container">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-4 text-sm text-on-surface text-center">
          {v != null && v !== '' ? String(v) : <span className="text-outline">—</span>}
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
        <p className="text-on-surface-variant text-sm">Select at least 2 properties to compare.</p>
        <Link to="/search" className="mt-4 inline-block text-primary text-sm font-medium hover:underline">
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
        <p className="text-error text-sm">Failed to load comparison. Please try again.</p>
        <Link to="/search" className="mt-4 inline-block text-primary text-sm font-medium hover:underline">
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
          <h1 className="text-2xl font-headline font-bold text-on-surface">Property Comparison</h1>
          <p className="text-sm text-on-surface-variant mt-1">AI-powered side-by-side analysis of {count} properties</p>
        </div>
        <Link to="/search" className="text-sm text-primary hover:text-on-surface font-medium flex items-center gap-1">
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
              className={`bg-surface-container border p-4 flex flex-col gap-3 ${
                isBest ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'
              }`}
            >
              {isBest && (
                <span className="self-start text-xs font-semibold bg-primary text-on-primary px-2 py-0.5 rounded-full">
                  Best Pick
                </span>
              )}
              <div className="h-28 overflow-hidden bg-surface-container-high">
                <img
                  src={p.photos?.[0] ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Link
                  to={`/property/${p.id}`}
                  className="text-sm font-semibold text-on-surface line-clamp-2 hover:text-primary leading-snug transition-colors"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-on-surface-variant mt-1">{p.locality}, {p.city}</p>
              </div>
              {rating && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={rating.overall_score} />
                    <span className="text-xs text-on-surface-variant">AI Score</span>
                  </div>
                  <RatingBar score={rating.overall_score} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="bg-surface-container border border-outline-variant overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant text-left w-32 sticky left-0 bg-surface-container-low border-r border-outline-variant">
                Attribute
              </th>
              {properties.map((p) => (
                <th key={p.id} className="py-3 px-4 text-xs font-semibold text-on-surface text-center">
                  {p.locality}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
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
        <h2 className="text-lg font-headline font-semibold text-on-surface mb-4">AI Assessment per Property</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
          {properties.map((p) => {
            const rating = ratingMap.get(p.id);
            const isBest = p.id === ai_comparison.best_pick_id;
            return (
              <div
                key={p.id}
                className={`bg-surface-container border p-5 space-y-4 ${
                  isBest ? 'border-primary' : 'border-outline-variant'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-on-surface line-clamp-1 flex-1">{p.title}</p>
                  {isBest && (
                    <span className="text-xs bg-primary text-on-primary px-2 py-0.5 rounded-full flex-shrink-0">Best</span>
                  )}
                </div>
                {rating ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-secondary mb-1.5">Strengths</p>
                      <ul className="space-y-1">
                        {rating.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface">
                            <span className="material-symbols-outlined text-secondary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-error mb-1.5">Weaknesses</p>
                      <ul className="space-y-1">
                        {rating.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface">
                            <span className="material-symbols-outlined text-error text-sm mt-0.5 flex-shrink-0">cancel</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-on-surface-variant">No AI assessment available</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Summary */}
      <div className="bg-surface-container-high border border-primary/30 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
          </div>
          <h2 className="text-lg font-headline font-semibold text-on-surface">AI Recommendation</h2>
        </div>

        {bestProp && (
          <div className="bg-surface-container border border-outline-variant p-4 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 overflow-hidden bg-surface-container-low">
              <img
                src={bestProp.photos?.[0] ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'}
                alt={bestProp.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Best Pick</p>
              <p className="font-semibold text-on-surface">{bestProp.title}</p>
              <p className="text-sm text-on-surface-variant mt-0.5">{bestProp.locality} · {formatRupeesCr(bestProp.price)}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              {ratingMap.get(bestProp.id) && (
                <span className="text-3xl font-bold text-primary">
                  {ratingMap.get(bestProp.id)!.overall_score}<span className="text-sm text-on-surface-variant">/10</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
          <p className="text-on-surface font-medium">{ai_comparison.best_pick_reason}</p>
          <p>{ai_comparison.summary}</p>
        </div>

        <div className="pt-1">
          {bestProp && (
            <Link
              to={`/property/${bestProp.id}`}
              className="inline-flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2 hover:bg-primary-fixed transition-colors"
            >
              View {bestProp.locality} Property
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
