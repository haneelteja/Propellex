import { useFilterStore } from '@/store/filterStore';
import { Button } from '@/components/shared/Button';

const LOCALITIES = [
  '', 'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
];

export function PropertyFilters() {
  const { filters, setFilter, reset } = useFilterStore();

  return (
    <aside className="w-64 shrink-0 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">Filters</h2>
        <button
          onClick={reset}
          className="text-xs text-brand hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Property type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Property Type</label>
        <select
          value={filters.property_type}
          onChange={(e) => setFilter('property_type', e.target.value as typeof filters.property_type)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="plot">Plot</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Possession Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as typeof filters.status)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="">All</option>
          <option value="ready_to_move">Ready to Move</option>
          <option value="under_construction">Under Construction</option>
        </select>
      </div>

      {/* Locality */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Locality</label>
        <select
          value={filters.locality}
          onChange={(e) => setFilter('locality', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          {LOCALITIES.map((l) => (
            <option key={l} value={l}>{l || 'All Localities'}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Bedrooms</label>
        <div className="flex gap-2 flex-wrap">
          {(['', 2, 3, 4, 5] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilter('bedrooms', b)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.bedrooms === b
                  ? 'bg-navy text-white border-navy'
                  : 'border-gray-300 text-gray-600 hover:border-navy'
              }`}
            >
              {b === '' ? 'Any' : `${b}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Budget (₹ Cr)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.price_min === '' ? '' : filters.price_min / 1_00_00_000}
            onChange={(e) =>
              setFilter('price_min', e.target.value ? Math.round(Number(e.target.value) * 1_00_00_000) : '')
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.price_max === '' ? '' : filters.price_max / 1_00_00_000}
            onChange={(e) =>
              setFilter('price_max', e.target.value ? Math.round(Number(e.target.value) * 1_00_00_000) : '')
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {/* RERA status */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">RERA Status</label>
        <select
          value={filters.rera_status}
          onChange={(e) => setFilter('rera_status', e.target.value as typeof filters.rera_status)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="">All</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Sort By</label>
        <select
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value as typeof filters.sort)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="published_desc">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="area_desc">Largest Area</option>
        </select>
      </div>

      <Button variant="ghost" className="w-full" onClick={reset}>
        Reset Filters
      </Button>
    </aside>
  );
}
