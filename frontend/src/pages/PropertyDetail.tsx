import { useParams, Link } from 'react-router-dom';
import { useProperty, usePropertyAnalysis } from '@/hooks/useProperties';
import { useAddToPortfolio } from '@/hooks/usePortfolio';
import { RERABadge } from '@/components/property/RERABadge';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatRupeesCr, formatRupees, formatDate, riskLabel } from '@/lib/utils';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id!);
  const { data: analysis } = usePropertyAnalysis(id!);
  const addToPortfolio = useAddToPortfolio();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Property not found.</p>
        <Link to="/search" className="text-brand hover:underline text-sm mt-2 inline-block">
          ← Back to search
        </Link>
      </div>
    );
  }

  const risk = riskLabel(property.risk_score);
  const riskVariant = { Low: 'success', Medium: 'warning', High: 'danger' }[risk] as 'success' | 'warning' | 'danger';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/search" className="text-brand text-sm hover:underline mb-4 inline-block">
        ← Back to search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex gap-2">
              <RERABadge status={property.rera_status} />
              <Badge variant={property.status === 'ready_to_move' ? 'success' : 'info'}>
                {property.status === 'ready_to_move' ? 'Ready to Move' : 'Under Construction'}
              </Badge>
            </div>
          </div>

          {/* Title & location */}
          <div>
            <h1 className="text-2xl font-bold text-navy mb-1">{property.title}</h1>
            <p className="text-gray-500 text-sm">
              {property.locality}, {property.city} — {property.pincode}
            </p>
            <p className="text-xs text-gray-400 mt-1">RERA: {property.rera_number}</p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Area', value: `${property.area_sqft.toLocaleString('en-IN')} sqft` },
              { label: 'Bedrooms', value: property.bedrooms ? `${property.bedrooms} BHK` : 'N/A' },
              { label: 'Bathrooms', value: property.bathrooms ?? 'N/A' },
              { label: 'Price/sqft', value: `₹${Math.round(property.price_per_sqft / 100).toLocaleString('en-IN')}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface rounded-xl p-3 text-center">
                <div className="text-sm font-semibold text-navy">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-2">About this property</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <Badge key={a} variant="neutral">{a}</Badge>
              ))}
            </div>
          </div>

          {/* Builder */}
          <div className="bg-surface rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Builder</p>
            <p className="font-semibold text-navy">{property.builder_name}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-20">
            <p className="text-3xl font-bold text-navy mb-1">
              {formatRupeesCr(property.price)}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {formatRupees(property.price)} total
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROI Estimate (3yr)</span>
                <span className="font-semibold text-emerald-600">
                  {property.roi_estimate_3yr}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Level</span>
                <Badge variant={riskVariant}>{risk}</Badge>
              </div>
              {analysis && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price/sqft</span>
                    <span className="font-medium">
                      ₹{Math.round(analysis.price_per_sqft / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Listed on</span>
                <span className="font-medium">{formatDate(property.published_at)}</span>
              </div>
            </div>

            <Button
              className="w-full mb-2"
              onClick={() =>
                addToPortfolio.mutate({ property_id: property.id, intent: 'buy' })
              }
              loading={addToPortfolio.isPending}
            >
              Add to Shortlist
            </Button>
            <Button variant="ghost" className="w-full">
              Request Site Visit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
