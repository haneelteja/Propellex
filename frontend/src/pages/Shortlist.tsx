import { usePortfolio, useRemoveFromPortfolio } from '@/hooks/usePortfolio';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyCardSkeleton } from '@/components/shared/Skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/shared/Button';

export default function Shortlist() {
  const { data: items, isLoading } = usePortfolio();
  const remove = useRemoveFromPortfolio();

  const handleRemove = (id: string) => remove.mutate(id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">My Shortlist</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {items?.length ?? 0} properties saved
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : !items?.length ? (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">favorite</span>
          <p className="text-sm mb-4">No properties shortlisted yet.</p>
          <Link to="/search">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <PropertyCard property={item.property} />
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-2 right-2 bg-error text-on-error text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
