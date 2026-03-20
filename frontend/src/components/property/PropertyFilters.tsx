import { useFilterStore } from '@/store/filterStore';

const LOCALITIES = [
  'Jubilee Hills',
  'Banjara Hills',
  'Gachibowli',
  'Kondapur',
  'Kokapet',
  'Hitech City',
  'Madhapur',
  'Nanakramguda',
] as const;

const PROPERTY_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'plot', label: 'Plot' },
] as const;

const BEDROOM_OPTIONS = ['', 2, 3, 4, 5] as const;

const selectClass =
  'w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-2.5 font-body text-sm placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none appearance-none';

const inputClass =
  'w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-2.5 font-body text-sm placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none';

export function PropertyFilters() {
  const { filters, setFilter, reset } = useFilterStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label text-[10px] text-primary uppercase tracking-[0.3em]">
          Refine Selection
        </h3>
        <button
          onClick={reset}
          className="font-label text-[10px] text-primary uppercase tracking-wider border-b border-primary/30 pb-0.5 hover:border-primary transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Property Type — pills */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Property Type
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('property_type', '')}
            className={`px-4 py-2 text-xs font-label uppercase tracking-wider border transition-colors ${
              filters.property_type === ''
                ? 'bg-primary-container text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            All
          </button>
          {PROPERTY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('property_type', value)}
              className={`px-4 py-2 text-xs font-label uppercase tracking-wider border transition-colors ${
                filters.property_type === value
                  ? 'bg-primary-container text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms — pills */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Bedrooms
        </p>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((b) => (
            <button
              key={b}
              onClick={() => setFilter('bedrooms', b)}
              className={`px-4 py-2 text-xs font-label uppercase tracking-wider border transition-colors ${
                filters.bedrooms === b
                  ? 'bg-primary-container text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {b === '' ? 'Any' : `${b}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Budget Range (₹ Cr)
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.price_min === '' ? '' : filters.price_min / 1_00_00_000}
            onChange={(e) =>
              setFilter(
                'price_min',
                e.target.value ? Math.round(Number(e.target.value) * 1_00_00_000) : '',
              )
            }
            className={inputClass}
          />
          <span className="text-on-surface-variant/40 font-label text-xs shrink-0">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.price_max === '' ? '' : filters.price_max / 1_00_00_000}
            onChange={(e) =>
              setFilter(
                'price_max',
                e.target.value ? Math.round(Number(e.target.value) * 1_00_00_000) : '',
              )
            }
            className={inputClass}
          />
        </div>
      </div>

      {/* Locality — checkboxes */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Locality
        </p>
        <div className="space-y-2">
          {LOCALITIES.map((l) => {
            const active = filters.locality === l;
            return (
              <button
                key={l}
                onClick={() => setFilter('locality', active ? '' : l)}
                className={`w-full flex items-center justify-between px-3 py-2 border text-left transition-colors font-body text-xs ${
                  active
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface'
                }`}
              >
                <span>{l}</span>
                {active && (
                  <span className="material-symbols-outlined text-sm leading-none">check</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Possession Status */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Possession Status
        </p>
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as typeof filters.status)}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          <option value="ready_to_move">Ready to Move</option>
          <option value="under_construction">Under Construction</option>
        </select>
      </div>

      {/* RERA Status */}
      <div>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          RERA Status
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: '', label: 'All' },
              { value: 'verified', label: 'Verified' },
              { value: 'pending', label: 'Pending' },
              { value: 'flagged', label: 'Flagged' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('rera_status', value)}
              className={`px-4 py-2 text-xs font-label uppercase tracking-wider border transition-colors ${
                filters.rera_status === value
                  ? 'bg-primary-container text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
