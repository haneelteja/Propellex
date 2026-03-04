import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from '@/components/shared/Skeleton';
import type { Property, ScoredProperty } from '@/types';

interface PropertyGridProps {
  properties: (Property | ScoredProperty)[];
  loading?: boolean;
  shortlistedIds?: Set<string>;
  onShortlist?: (id: string) => void;
  emptyMessage?: string;
}

export function PropertyGrid({
  properties,
  loading,
  shortlistedIds,
  onShortlist,
  emptyMessage = 'No properties found.',
}: PropertyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {properties.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          shortlisted={shortlistedIds?.has(p.id)}
          onShortlist={onShortlist}
        />
      ))}
    </div>
  );
}
