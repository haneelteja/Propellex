import { useParams, Link } from 'react-router-dom';
import { useProperty, usePropertyAnalysis } from '@/hooks/useProperties';
import { useAddToPortfolio } from '@/hooks/usePortfolio';
import { RERABadge } from '@/components/property/RERABadge';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatRupeesCr, formatRupees, formatDate, riskLabel } from '@/lib/utils';
import type { AiPropertyAnalysis } from '@/types';

function AiAnalysisPanel({ analysis, analyzedAt }: { analysis: AiPropertyAnalysis; analyzedAt: string | null }) {
  const scoreColor =
    analysis.overall_score >= 8 ? 'text-emerald-600' :
    analysis.overall_score >= 5 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy flex items-center gap-2">
          <span className="text-brand">✦</span> AI Investment Analysis
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${scoreColor}`}>{analysis.overall_score}/10</span>
          {analyzedAt && (
            <span className="text-xs text-gray-400">Updated {formatDate(analyzedAt)}</span>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-surface rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Investment Recommendation</p>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.investment_recommendation}</p>
      </div>

      {/* Market Insights */}
      <div className="bg-surface rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Market Insights</p>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.market_insights}</p>
      </div>

      {/* Best Suited For */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Best Suited For</p>
        <p className="text-sm text-navy font-medium">{analysis.best_suited_for}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Advantages */}
        <div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Advantages</p>
          <ul className="space-y-1.5">
            {analysis.advantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                {adv}
              </li>
            ))}
          </ul>
        </div>

        {/* Disadvantages */}
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Disadvantages</p>
          <ul className="space-y-1.5">
            {analysis.disadvantages.map((dis, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                {dis}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risk Factors */}
      {analysis.risk_factors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Risk Factors</p>
          <div className="flex flex-wrap gap-2">
            {analysis.risk_factors.map((rf, i) => (
              <span key={i} className="bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-full border border-amber-200">
                {rf}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

          {/* AI Analysis */}
          {property.ai_analysis ? (
            <AiAnalysisPanel
              analysis={property.ai_analysis}
              analyzedAt={property.ai_analyzed_at}
            />
          ) : (
            <div className="bg-surface border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-400">AI analysis will appear here once generated (runs daily).</p>
            </div>
          )}
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price/sqft</span>
                  <span className="font-medium">
                    ₹{Math.round(analysis.price_per_sqft / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {property.ai_analysis && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">AI Score</span>
                  <span className={`font-bold ${
                    property.ai_analysis.overall_score >= 8 ? 'text-emerald-600' :
                    property.ai_analysis.overall_score >= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {property.ai_analysis.overall_score}/10
                  </span>
                </div>
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
