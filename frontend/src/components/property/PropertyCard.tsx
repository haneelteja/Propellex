import { Link } from 'react-router-dom';
import { formatRupeesCr } from '@/lib/utils';
import type { Property, ScoredProperty, ReraStatus } from '@/types';

interface PropertyCardProps {
  property: Property | ScoredProperty;
  onShortlist?: (id: string) => void;
  shortlisted?: boolean;
  compareMode?: boolean;
  compareSelected?: boolean;
  onCompareToggle?: (id: string) => void;
  compareDisabled?: boolean; // max 4 reached and this one not selected
}

function isScored(p: Property | ScoredProperty): p is ScoredProperty {
  return 'match_score' in p;
}

// Inline RERA badge styled for the Sovereign design system
function ReraChip({ status }: { status: ReraStatus }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
        <span className="material-symbols-outlined text-[12px]">verified</span>
        RERA
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant px-3 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
        <span className="material-symbols-outlined text-[12px]">pending</span>
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-3 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
      <span className="material-symbols-outlined text-[12px]">warning</span>
      Flagged
    </span>
  );
}

export function PropertyCard({
  property,
  onShortlist,
  shortlisted,
  compareMode,
  compareSelected,
  onCompareToggle,
  compareDisabled,
}: PropertyCardProps) {
  const scored = isScored(property);
  const roi = parseFloat(property.roi_estimate_3yr);
  const isHighRoi = roi >= 12;

  return (
    <div
      className={`group relative bg-surface-container-low overflow-hidden transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] ${
        compareMode && compareSelected
          ? 'outline outline-2 outline-primary'
          : 'outline outline-1 outline-outline-variant'
      } ${compareMode && compareDisabled ? 'opacity-40' : ''}`}
    >
      {/* Compare checkbox overlay */}
      {compareMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!compareDisabled || compareSelected) onCompareToggle?.(property.id);
          }}
          className={`absolute top-4 left-4 z-10 w-6 h-6 border-2 flex items-center justify-center transition-colors ${
            compareSelected
              ? 'bg-primary border-primary'
              : 'bg-surface-container-high border-outline hover:border-primary'
          } ${compareDisabled && !compareSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {compareSelected && (
            <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
          )}
        </button>
      )}

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-surface-container-high">
        <img
          src={
            property.photos[0] ??
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
          }
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Top-left badge strip */}
      <div className="absolute top-6 left-6 flex flex-wrap gap-2">
        {isHighRoi && !compareMode && (
          <span className="bg-secondary-container text-on-secondary-container px-4 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
            High ROI: {property.roi_estimate_3yr}%
          </span>
        )}
        {scored && !compareMode && (
          <span className="bg-primary text-on-primary px-4 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
            {Math.round(property.match_score)}% Match
          </span>
        )}
        {property.status === 'ready_to_move' && (
          <span className="bg-surface-container-high/80 text-on-surface-variant px-4 py-1 text-[10px] font-label font-bold uppercase tracking-widest">
            Ready to Move
          </span>
        )}
      </div>

      {/* Shortlist button */}
      {onShortlist && !compareMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onShortlist(property.id);
          }}
          className="absolute top-6 right-6 z-10 w-9 h-9 bg-surface-container-high/80 flex items-center justify-center hover:bg-surface-container-high transition-colors duration-200"
          title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              shortlisted ? 'text-error' : 'text-on-surface-variant hover:text-primary'
            }`}
            style={{ fontVariationSettings: shortlisted ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      )}

      {/* Card body */}
      <Link to={`/property/${property.id}`} className="block p-6">
        <div className="flex justify-between items-start mb-3 gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-headline text-on-surface leading-snug line-clamp-2 mb-1">
              {property.title}
            </h3>
            <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest">
              {property.locality}, Hyderabad
            </p>
          </div>
          <p className="text-xl font-headline text-primary shrink-0">
            {formatRupeesCr(property.price)}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-outline-variant/30 my-4" />

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 text-on-surface-variant text-sm font-body mb-4">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">bed</span>
              {property.bedrooms} BHK
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">straighten</span>
            {property.area_sqft.toLocaleString('en-IN')} sqft
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">category</span>
            {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
          </span>
        </div>

        {/* Bottom row: ROI + RERA */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-secondary text-xs font-label font-semibold uppercase tracking-widest">
            {property.roi_estimate_3yr}% ROI (3yr)
          </span>
          <ReraChip status={property.rera_status} />
        </div>

        {/* Why recommended */}
        {scored && (
          <div className="mt-3 pt-3 border-t border-outline-variant/30">
            <span className="inline-block bg-primary/10 text-primary px-3 py-1 text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20">
              {(property as ScoredProperty).why_recommended}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}
