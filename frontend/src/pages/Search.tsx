import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { useFilterStore } from '@/store/filterStore';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PropertyMap } from '@/components/property/PropertyMap';
import { Button } from '@/components/shared/Button';
import { usePortfolio, useAddToPortfolio } from '@/hooks/usePortfolio';

export default function Search() {
  const navigate = useNavigate();
  const { filters, setFilter, page, setPage, showMap, toggleMap } = useFilterStore();
  const { data, pagination, isLoading, isFetching } = useProperties();
  const { data: portfolioItems } = usePortfolio();
  const addToPortfolio = useAddToPortfolio();
  const [searchInput, setSearchInput] = useState(filters.query);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const shortlistedIds = new Set(portfolioItems?.map((p) => p.property_id) ?? []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('query', searchInput);
  };

  const handleShortlist = (propertyId: string) => {
    if (shortlistedIds.has(propertyId)) return;
    addToPortfolio.mutate({ property_id: propertyId, intent: 'watch' });
  };

  const toggleCompareMode = () => {
    setCompareMode((v) => !v);
    setCompareIds(new Set());
  };

  const handleCompareToggle = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompareNow = () => {
    if (compareIds.size < 2) return;
    navigate(`/compare?ids=${Array.from(compareIds).join(',')}`);
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
        <Button
          type="button"
          variant={compareMode ? 'secondary' : 'ghost'}
          size="lg"
          onClick={toggleCompareMode}
        >
          {compareMode ? 'Cancel Compare' : 'Compare'}
        </Button>
      </form>

      {/* Compare hint banner */}
      {compareMode && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select 2–4 properties to compare. {compareIds.size > 0 ? `${compareIds.size} selected.` : 'Click a property card to select it.'}
          {compareIds.size >= 4 && ' Maximum reached.'}
        </div>
      )}

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
            compareMode={compareMode}
            compareSelectedIds={compareIds}
            onCompareToggle={handleCompareToggle}
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

      {/* Floating compare bar */}
      {compareMode && compareIds.size >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-navy text-white px-6 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">
            {compareIds.size} {compareIds.size === 1 ? 'property' : 'properties'} selected
          </span>
          <span className="text-white/40 text-xs">(min 2, max 4)</span>
          <Button
            size="sm"
            onClick={handleCompareNow}
            disabled={compareIds.size < 2}
            className="bg-brand hover:bg-brand/90 text-white disabled:opacity-50"
          >
            Compare Now →
          </Button>
        </div>
      )}
    </div>
  );
}
