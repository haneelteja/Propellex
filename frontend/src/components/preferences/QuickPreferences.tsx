import { useState } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { useAuthStore } from '@/store/authStore';
import { usePreferenceStore } from '@/store/preferenceStore';
import type { PriceTier } from '@/store/preferenceStore';
import type { PropertyType } from '@/types';

const LOCALITIES = [
  'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
];

const PROPERTY_TYPES: { value: PropertyType | ''; label: string }[] = [
  { value: '',            label: 'All'         },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial'  },
  { value: 'plot',        label: 'Plot'        },
];

export function QuickPreferences() {
  const { filters, setFilter, setFilters } = useFilterStore();
  const user = useAuthStore((s) => s.user);
  const { tiers, setTiers, resetTiers } = usePreferenceStore();

  const [editingTiers, setEditingTiers] = useState(false);
  const [draftTiers, setDraftTiers] = useState<PriceTier[]>(tiers);

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Which preset tier is currently active (−1 = none / custom)
  const activeTierIdx = tiers.findIndex(
    (t) => filters.price_min === t.min && filters.price_max === t.max,
  );

  const applyTier = (idx: number) => {
    if (activeTierIdx === idx) {
      setFilters({ price_min: '', price_max: '' });
    } else {
      setFilters({ price_min: tiers[idx].min, price_max: tiers[idx].max });
    }
  };

  const hasAnyFilter =
    !!filters.property_type || !!filters.locality || filters.price_min !== '';

  const openEdit = () => {
    setDraftTiers(tiers);
    setEditingTiers(true);
  };

  const saveTiers = () => {
    setTiers(draftTiers);
    const stillValid = draftTiers.some(
      (t) => t.min === filters.price_min && t.max === filters.price_max,
    );
    if (!stillValid) setFilters({ price_min: '', price_max: '' });
    setEditingTiers(false);
  };

  return (
    <>
      <div className="bg-surface-container border border-outline-variant p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wide">
            Preferences
          </h3>
          {hasAnyFilter && (
            <button
              onClick={() =>
                setFilters({ property_type: '', locality: '', price_min: '', price_max: '' })
              }
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Property Type */}
        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-2">Property Type</p>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() =>
                  setFilter('property_type', value as typeof filters.property_type)
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filters.property_type === value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-2">City</p>
          <div className="px-3 py-1.5 bg-surface-container-low border border-outline-variant text-xs text-on-surface font-semibold">
            Hyderabad
          </div>
        </div>

        {/* Area / Locality */}
        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-2">Area</p>
          <div className="flex flex-wrap gap-1.5">
            {LOCALITIES.map((loc) => (
              <button
                key={loc}
                onClick={() =>
                  setFilter('locality', filters.locality === loc ? '' : loc)
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filters.locality === loc
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-on-surface-variant">Price Range</p>
            {isManager && (
              <button
                onClick={openEdit}
                className="text-xs text-primary hover:underline font-medium"
              >
                Edit ranges
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {tiers.map((tier, idx) => (
              <button
                key={idx}
                onClick={() => applyTier(idx)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium border transition-colors text-left ${
                  activeTierIdx === idx
                    ? 'bg-primary/10 border-primary text-on-surface'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    activeTierIdx === idx ? 'border-primary' : 'border-outline'
                  }`}
                >
                  {activeTierIdx === idx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </span>
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manager — Edit Tiers Modal */}
      {editingTiers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container border border-outline-variant shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-headline font-bold text-on-surface mb-4">Configure Price Ranges</h3>

            <div className="space-y-4">
              {draftTiers.map((tier, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-xs text-on-surface-variant font-medium">Range {idx + 1}</p>
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) =>
                      setDraftTiers((d) =>
                        d.map((t, i) =>
                          i === idx ? { ...t, label: e.target.value } : t,
                        ),
                      )
                    }
                    placeholder="Label (e.g. ₹10L – ₹50L)"
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min (₹)"
                      value={tier.min}
                      onChange={(e) =>
                        setDraftTiers((d) =>
                          d.map((t, i) =>
                            i === idx ? { ...t, min: Number(e.target.value) } : t,
                          ),
                        )
                      }
                      className="flex-1 bg-surface-container-low border border-outline-variant text-on-surface px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max (₹)"
                      value={tier.max}
                      onChange={(e) =>
                        setDraftTiers((d) =>
                          d.map((t, i) =>
                            i === idx ? { ...t, max: Number(e.target.value) } : t,
                          ),
                        )
                      }
                      className="flex-1 bg-surface-container-low border border-outline-variant text-on-surface px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={saveTiers}
                className="flex-1 bg-primary text-on-primary py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Save
              </button>
              <button
                onClick={() => {
                  resetTiers();
                  setEditingTiers(false);
                  setFilters({ price_min: '', price_max: '' });
                }}
                className="px-4 border border-outline-variant text-on-surface-variant py-2 text-xs hover:bg-surface-container-low"
              >
                Reset
              </button>
              <button
                onClick={() => setEditingTiers(false)}
                className="px-4 border border-outline-variant text-on-surface-variant py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
