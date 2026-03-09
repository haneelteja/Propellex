import { Link } from 'react-router-dom';
import { Badge } from '@/components/shared/Badge';
import { RERABadge } from './RERABadge';
import { formatRupeesCr } from '@/lib/utils';
import type { Property, ScoredProperty } from '@/types';

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

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group relative ${
        compareMode && compareSelected ? 'ring-2 ring-brand' : ''
      } ${compareMode && compareDisabled ? 'opacity-50' : ''}`}
    >
      {/* Compare checkbox overlay */}
      {compareMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!compareDisabled || compareSelected) onCompareToggle?.(property.id);
          }}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            compareSelected
              ? 'bg-brand border-brand'
              : 'bg-white/90 border-gray-300 hover:border-brand'
          } ${compareDisabled && !compareSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {compareSelected && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={property.photos[0] ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Match score badge */}
        {scored && !compareMode && (
          <div className="absolute top-2 left-2 bg-navy text-white text-xs font-bold px-2 py-1 rounded-lg">
            {Math.round(property.match_score)}% match
          </div>
        )}
        {/* Shortlist button */}
        {onShortlist && !compareMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onShortlist(property.id);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg
              className={`w-4 h-4 ${shortlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill={shortlisted ? 'currentColor' : 'none'}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
        {/* Status badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant={property.status === 'ready_to_move' ? 'success' : 'info'}>
            {property.status === 'ready_to_move' ? 'Ready to Move' : 'Under Construction'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <Link to={`/property/${property.id}`} className="block p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-navy line-clamp-2 leading-snug">
            {property.title}
          </h3>
          <RERABadge status={property.rera_status} />
        </div>

        <p className="text-xs text-gray-500">
          {property.locality}, {property.city}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          {property.bedrooms && (
            <span>{property.bedrooms} BHK</span>
          )}
          <span>{property.area_sqft.toLocaleString('en-IN')} sqft</span>
          <span>₹{Math.round(property.price_per_sqft / 100).toLocaleString('en-IN')}/sqft</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-navy">
            {formatRupeesCr(property.price)}
          </span>
          <span className="text-xs text-emerald-600 font-medium">
            {property.roi_estimate_3yr}% ROI (3yr)
          </span>
        </div>

        {/* Why recommended tag */}
        {scored && (
          <div className="pt-1">
            <Badge variant="gold">{(property as ScoredProperty).why_recommended}</Badge>
          </div>
        )}
      </Link>
    </div>
  );
}
