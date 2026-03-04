import { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { useFilterStore } from '@/store/filterStore';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PropertyMap } from '@/components/property/PropertyMap';
import { Button } from '@/components/shared/Button';
import { usePortfolio, useAddToPortfolio } from '@/hooks/usePortfolio';

export default function Search() {
  const { filters, setFilter, page, setPage, showMap, toggleMap } = useFilterStore();
  const { data, pagination, isLoading, isFetching } = useProperties();
  const { data: portfolioItems } = usePortfolio();
  const addToPortfolio = useAddToPortfolio();
  const [searchInput, setSearchInput] = useState(filters.query);

  const shortlistedIds = new Set(portfolioItems?.map((p) => p.property_id) ?? []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('query', searchInput);
  };

  const handleShortlist = (propertyId: string) => {
    if (shortlistedIds.has(propertyId)) return;
    addToPortfolio.mutate({ property_id: propertyId, intent: 'watch' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder='Search properties, localities, builders... e.g. "3BHK Gachibowli"'
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
        <Button type="submit" size="lg">Search</Button>
        <Button
          type="button"
          variant={showMap ? 'secondary' : 'ghost'}
          size="lg"
          onClick={toggleMap}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
      </form>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <PropertyFilters />

        {/* Results area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Result count + loading indicator */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isFetching
                ? 'Searching...'
                : pagination
                ? `${pagination.total} properties found`
                : ''}
            </p>
          </div>

          {/* Map view */}
          {showMap && data.length > 0 && (
            <div className="h-80 rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <PropertyMap properties={data} />
            </div>
          )}

          {/* Property grid */}
          <PropertyGrid
            properties={data}
            loading={isLoading}
            shortlistedIds={shortlistedIds}
            onShortlist={handleShortlist}
          />

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="ghost"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
