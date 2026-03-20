import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { useFilterStore } from '@/store/filterStore';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { QuickPreferences } from '@/components/preferences/QuickPreferences';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PropertyMap } from '@/components/property/PropertyMap';
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

  const resultLabel = isFetching
    ? 'Searching...'
    : pagination
      ? `${pagination.total} Properties Found`
      : '0 Properties Found';

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="pt-24 px-8 pb-8 bg-surface-container-low border-b border-outline-variant">
        <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-3 block">
          Property Intelligence
        </span>
        <h1 className="font-headline text-4xl font-light text-on-surface mb-6">
          Discover{' '}
          <span className="italic text-primary">Hyderabad's</span>{' '}
          Finest
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-0">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by locality, builder, or property type..."
            className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface px-6 py-4 font-body text-sm placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm leading-none">search</span>
            Search
          </button>
        </form>

        {/* Action row: map toggle + compare */}
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            onClick={toggleMap}
            className={`flex items-center gap-2 font-label text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              showMap
                ? 'border-primary text-primary bg-primary/5'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm leading-none">map</span>
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <button
            type="button"
            onClick={toggleCompareMode}
            className={`flex items-center gap-2 font-label text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              compareMode
                ? 'border-primary text-primary bg-primary/5'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm leading-none">compare</span>
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Compare hint banner */}
      {compareMode && (
        <div className="px-8 py-3 bg-surface-container border-b border-outline-variant flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-sm leading-none">
            info
          </span>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
            Select 2–4 properties to compare.{' '}
            {compareIds.size > 0 ? `${compareIds.size} selected.` : 'Click a card to select.'}
            {compareIds.size >= 4 && ' Maximum reached.'}
          </p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant p-6 space-y-8">
          <QuickPreferences />
          <PropertyFilters />
        </aside>

        {/* Results area */}
        <div className="flex-1 p-8">
          {/* Toolbar: count + sort */}
          <div className="flex justify-between items-center mb-8">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
              {resultLabel}
            </p>
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value as typeof filters.sort)}
              className="bg-surface-container border border-outline-variant text-on-surface px-4 py-2 font-label text-xs uppercase tracking-wider focus:border-primary focus:outline-none appearance-none"
            >
              <option value="published_desc">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Largest Area</option>
            </select>
          </div>

          {/* Map view */}
          {showMap && data.length > 0 && (
            <div className="h-80 overflow-hidden border border-outline-variant mb-8">
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

      {/* Floating compare bar */}
      {compareMode && compareIds.size >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-surface-container-high border border-outline-variant px-8 py-4 shadow-2xl">
          <span className="font-label text-xs text-on-surface uppercase tracking-widest">
            {compareIds.size} {compareIds.size === 1 ? 'property' : 'properties'} selected
          </span>
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">
            min 2 · max 4
          </span>
          <button
            onClick={handleCompareNow}
            disabled={compareIds.size < 2}
            className="bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Compare Now
            <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
