import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProperty, usePropertyAnalysis } from '@/hooks/useProperties';
import { useAddToPortfolio } from '@/hooks/usePortfolio';
import { useAuthStore } from '@/store/authStore';
import { PropertyMap } from '@/components/property/PropertyMap';
import { ChatWidget } from '@/components/chatbot/ChatWidget';
import { Skeleton } from '@/components/shared/Skeleton';
import { RoiCalculator } from '@/components/property/RoiCalculator';
import { PriceTrendChart } from '@/components/property/PriceTrendChart';
import { formatRupeesCr, formatRupees, formatDate, riskLabel } from '@/lib/utils';
import type { AiPropertyAnalysis, Property } from '@/types';

// ── Amenity icon mapping ──────────────────────────────────────────────────────

function amenityIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('pool') || n.includes('swim')) return 'pool';
  if (n.includes('gym') || n.includes('fitness')) return 'fitness_center';
  if (n.includes('park') || n.includes('garden')) return 'park';
  if (n.includes('security') || n.includes('guard')) return 'security';
  if (n.includes('parking') || n.includes('garage')) return 'local_parking';
  if (n.includes('clubhouse') || n.includes('club')) return 'holiday_village';
  if (n.includes('lift') || n.includes('elevator')) return 'elevator';
  if (n.includes('power') || n.includes('backup')) return 'bolt';
  if (n.includes('water')) return 'water_drop';
  if (n.includes('wifi') || n.includes('internet')) return 'wifi';
  if (n.includes('play') || n.includes('kids')) return 'toys';
  if (n.includes('tennis') || n.includes('badminton') || n.includes('sport')) return 'sports_tennis';
  if (n.includes('cctv') || n.includes('camera')) return 'videocam';
  if (n.includes('concierge') || n.includes('reception')) return 'support_agent';
  if (n.includes('spa') || n.includes('sauna')) return 'spa';
  if (n.includes('library') || n.includes('reading')) return 'menu_book';
  if (n.includes('jogging') || n.includes('track')) return 'directions_run';
  if (n.includes('shop') || n.includes('mall') || n.includes('retail')) return 'storefront';
  return 'check_circle';
}

// ── SVG Sparkline for price trajectory ───────────────────────────────────────

function PriceSparkline({ roi }: { roi: string }) {
  // Generate a representative upward curve from the ROI value
  const roiNum = parseFloat(roi);
  const points = Array.from({ length: 12 }, (_, i) => {
    const x = (i / 11) * 340;
    const growthFactor = (roiNum / 100) * (i / 11);
    const noise = Math.sin(i * 1.3) * 4;
    const y = 60 - growthFactor * 40 + noise;
    return `${x},${Math.max(4, Math.min(64, y))}`;
  });
  const polyline = points.join(' ');
  const areaPath = `M 0,68 L ${points.join(' L ')} L 340,68 Z`;

  return (
    <svg
      viewBox="0 0 340 72"
      className="w-full h-16 mt-4"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f2ca50" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#f2ca50"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── AI Analysis section ───────────────────────────────────────────────────────

const BUILDER_GRADE_CONFIG = {
  premium:    { label: 'Premium Builder',    color: 'text-secondary',              bg: 'bg-secondary/10 border-secondary/30',    icon: 'workspace_premium' },
  verified:   { label: 'Verified Builder',   color: 'text-primary',                bg: 'bg-primary/10 border-primary/30',        icon: 'verified' },
  good:       { label: 'Good Track Record',  color: 'text-primary',                bg: 'bg-primary/5 border-primary/20',         icon: 'thumb_up' },
  standard:   { label: 'Standard Builder',   color: 'text-on-surface-variant',     bg: 'bg-surface-container border-outline-variant', icon: 'business' },
  unverified: { label: 'Unverified Builder', color: 'text-on-surface-variant',     bg: 'bg-surface-container border-outline-variant', icon: 'help_outline' },
  flagged:    { label: 'Flagged Builder',    color: 'text-error',                  bg: 'bg-error/10 border-error/30',            icon: 'flag' },
} as const;

interface AiAnalysisSectionProps {
  analysis: AiPropertyAnalysis;
  analyzedAt: string | null;
}

function AiAnalysisSection({ analysis, analyzedAt }: AiAnalysisSectionProps) {
  const isFlagged = analysis.overall_score === 0;
  const gradeKey = (analysis.builder_grade ?? 'unverified') as keyof typeof BUILDER_GRADE_CONFIG;
  const grade = BUILDER_GRADE_CONFIG[gradeKey] ?? BUILDER_GRADE_CONFIG.unverified;

  return (
    <section className="bg-surface-container-low border-t border-outline-variant">
      {/* Header row */}
      <div className="px-8 pt-10 pb-6 border-b border-outline-variant flex items-start justify-between gap-6">
        <div>
          <span className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-2 block">
            AI Intelligence
          </span>
          <h2 className="font-headline text-3xl font-light text-on-surface">
            Investment Analysis
          </h2>
        </div>
        <div className="text-right shrink-0">
          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
            AI Score
          </p>
          {isFlagged ? (
            <div className="flex items-center gap-1.5 justify-end">
              <span className="material-symbols-outlined text-error text-xl leading-none">warning</span>
              <p className="font-headline text-2xl text-error">Flagged</p>
            </div>
          ) : (
            <p
              className={
                analysis.overall_score >= 8
                  ? 'font-headline text-3xl text-secondary'
                  : analysis.overall_score >= 5
                  ? 'font-headline text-3xl text-primary'
                  : 'font-headline text-3xl text-error'
              }
            >
              {analysis.overall_score}
              <span className="text-on-surface-variant text-lg font-light">/10</span>
            </p>
          )}
          {analyzedAt && (
            <p className="font-label text-[10px] text-on-surface-variant mt-1">
              Updated {formatDate(analyzedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Flagged warning banner */}
      {isFlagged && (
        <div className="mx-8 mt-6 flex items-start gap-3 bg-error/10 border border-error/30 px-5 py-4">
          <span className="material-symbols-outlined text-error text-base mt-0.5 shrink-0">warning</span>
          <p className="font-body text-sm text-error leading-relaxed">
            This listing has been flagged by our AI as suspicious — the price deviates significantly from comparable properties in this locality, or there are serious compliance concerns. Exercise extreme caution before proceeding.
          </p>
        </div>
      )}

      {/* Builder Grade */}
      <div className="px-8 py-6 border-b border-outline-variant">
        <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3">
          Builder Assessment
        </p>
        <div className={`inline-flex items-center gap-2.5 px-4 py-2 border ${grade.bg}`}>
          <span className={`material-symbols-outlined text-base leading-none ${grade.color}`}>{grade.icon}</span>
          <span className={`font-label text-xs uppercase tracking-widest font-bold ${grade.color}`}>{grade.label}</span>
        </div>
        {analysis.builder_grade_reason && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2 max-w-2xl">
            {analysis.builder_grade_reason}
          </p>
        )}
      </div>

      {/* Advantages / Disadvantages */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-outline-variant">
        <div className="px-8 py-8 border-b md:border-b-0 md:border-r border-outline-variant">
          <p className="font-label text-xs text-secondary uppercase tracking-[0.2em] mb-5">
            Advantages
          </p>
          <ul className="space-y-3">
            {analysis.advantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-base mt-0.5 shrink-0">
                  check_circle
                </span>
                <span className="font-body text-sm text-on-surface leading-relaxed">{adv}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-8 py-8">
          <p className="font-label text-xs text-error uppercase tracking-[0.2em] mb-5">
            Disadvantages
          </p>
          <ul className="space-y-3">
            {analysis.disadvantages.map((dis, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-base mt-0.5 shrink-0">
                  cancel
                </span>
                <span className="font-body text-sm text-on-surface leading-relaxed">{dis}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Future Projects */}
      {analysis.future_projects?.length > 0 && (
        <div className="px-8 py-8 border-b border-outline-variant">
          <p className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-5">
            Upcoming Projects &amp; Infrastructure Impact
          </p>
          <ul className="space-y-3">
            {analysis.future_projects.map((proj, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">
                  construction
                </span>
                <span className="font-body text-sm text-on-surface leading-relaxed">{proj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Government & Private Interest */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-outline-variant">
        {analysis.government_interest && (
          <div className="px-8 py-8 border-b md:border-b-0 md:border-r border-outline-variant">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm leading-none">account_balance</span>
              Government Interest
            </p>
            <p className="font-body text-sm text-on-surface leading-relaxed">
              {analysis.government_interest}
            </p>
          </div>
        )}
        {analysis.private_interest && (
          <div className="px-8 py-8">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm leading-none">corporate_fare</span>
              Private Investment
            </p>
            <p className="font-body text-sm text-on-surface leading-relaxed">
              {analysis.private_interest}
            </p>
          </div>
        )}
      </div>

      {/* Tech & Employment Impact */}
      {analysis.tech_employment_impact && (
        <div className="px-8 py-8 border-b border-outline-variant">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm leading-none">computer</span>
            Tech &amp; Employment Impact
          </p>
          <p className="font-body text-sm text-on-surface leading-relaxed max-w-3xl">
            {analysis.tech_employment_impact}
          </p>
        </div>
      )}

      {/* Best suited for + Risk factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-outline-variant">
        <div className="px-8 py-8 border-b md:border-b-0 md:border-r border-outline-variant">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3">
            Best Suited For
          </p>
          <p className="font-body text-sm text-on-surface leading-relaxed">
            {analysis.best_suited_for}
          </p>
        </div>
        {analysis.risk_factors.length > 0 && (
          <div className="px-8 py-8">
            <p className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-4">
              Risk Factors
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.risk_factors.map((rf, i) => (
                <span
                  key={i}
                  className="bg-surface-container-high text-on-surface-variant font-label text-xs px-3 py-1.5 border border-outline-variant"
                >
                  {rf}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market insights + Investment recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="px-8 py-8 border-b md:border-b-0 md:border-r border-outline-variant">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3">
            Market Insights
          </p>
          <p className="font-body text-sm text-on-surface leading-relaxed">
            {analysis.market_insights}
          </p>
        </div>
        <div className="px-8 py-8">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-3">
            Investment Recommendation
          </p>
          <p className="font-body text-sm text-on-surface leading-relaxed">
            {analysis.investment_recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PropertyDetailSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="h-[600px] bg-surface-container-low animate-pulse" />
      <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

// ── Sticky action bar (mobile) / inline (desktop) ────────────────────────────

interface ActionBarProps {
  property: Property;
  onSave: () => void;
  isSaving: boolean;
  onCompare: () => void;
  isLoggedIn: boolean;
}

function ActionBar({ property, onSave, isSaving, onCompare, isLoggedIn }: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {isLoggedIn ? (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary font-label text-sm uppercase tracking-[0.15em] px-6 py-4 hover:bg-primary-fixed transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">bookmark_add</span>
          {isSaving ? 'Saving...' : 'Save to Portfolio'}
        </button>
      ) : (
        <Link
          to="/login"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary font-label text-sm uppercase tracking-[0.15em] px-6 py-4 hover:bg-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined text-base">login</span>
          Sign in to Save
        </Link>
      )}
      <button
        onClick={onCompare}
        className="flex-1 flex items-center justify-center gap-2 bg-surface-container-high text-on-surface font-label text-sm uppercase tracking-[0.15em] px-6 py-4 hover:bg-surface-container-highest transition-colors border border-outline-variant"
      >
        <span className="material-symbols-outlined text-base">compare_arrows</span>
        Compare
      </button>
      <a
        href={`mailto:nalluruhaneel@gmail.com?subject=Private Tour Request — ${property.title}`}
        className="flex-1 flex items-center justify-center gap-2 bg-surface-container-high text-on-surface font-label text-sm uppercase tracking-[0.15em] px-6 py-4 hover:bg-surface-container-highest transition-colors border border-outline-variant"
      >
        <span className="material-symbols-outlined text-base">calendar_month</span>
        Request Tour
      </a>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id!);
  // usePropertyAnalysis is used to get price_per_sqft from the analysis endpoint
  const { data: analysis } = usePropertyAnalysis(id!);
  const addToPortfolio = useAddToPortfolio();
  const token = useAuthStore((s) => s.token);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (!property) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant">
          search_off
        </span>
        <p className="font-headline text-2xl font-light text-on-surface">Property not found</p>
        <Link
          to="/search"
          className="font-label text-xs text-primary uppercase tracking-[0.2em] hover:text-primary-fixed transition-colors"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const risk = riskLabel(property.risk_score);
  const pricePerSqft = analysis?.price_per_sqft
    ? Math.round(analysis.price_per_sqft / 100).toLocaleString('en-IN')
    : Math.round(property.price_per_sqft).toLocaleString('en-IN');

  const handleSave = () => {
    addToPortfolio.mutate({ property_id: property.id, intent: 'buy' });
  };

  const handleCompare = () => {
    navigate(`/search?compareWith=${property.id}`);
  };

  const heroPhotos = property.photos.slice(0, 3);
  const remainingCount = property.photos.length - 3;

  return (
    <div className="bg-background min-h-screen font-body">

      {/* ── Back nav ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 font-label text-xs text-on-surface-variant uppercase tracking-[0.15em] hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Search
        </Link>
      </div>

      {/* ── Section 1: Asymmetric Hero Gallery ───────────────────────────── */}
      <section className="grid grid-cols-12 gap-1 p-1 bg-surface-container-low h-[600px]">

        {/* Main image: col-span-8 */}
        <div className="col-span-12 md:col-span-8 h-full relative overflow-hidden group">
          {heroPhotos[0] ? (
            <img
              src={heroPhotos[0]}
              alt={property.title}
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-8xl text-on-surface-variant">
                apartment
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* RERA / status badges */}
          <div className="absolute top-6 left-6 flex gap-2 z-10">
            <span
              className={
                property.rera_status === 'verified'
                  ? 'bg-secondary-container text-on-secondary-container font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5'
                  : property.rera_status === 'pending'
                  ? 'bg-surface-container-high text-primary font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-primary/30'
                  : property.rera_status === 'not_registered'
                  ? 'bg-error-container text-on-error-container font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5'
                  : property.rera_status === 'unknown'
                  ? 'bg-surface-container text-on-surface-variant/60 font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-outline-variant'
                  : 'bg-error-container text-on-error-container font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5'
              }
            >
              {property.rera_status === 'verified'
                ? 'RERA Verified'
                : property.rera_status === 'pending'
                ? 'RERA Pending'
                : property.rera_status === 'not_registered'
                ? 'Not Registered'
                : property.rera_status === 'unknown'
                ? 'RERA Unverified'
                : 'RERA Flagged'}
            </span>
            <span className="bg-surface-container text-on-surface font-label text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-outline-variant">
              {property.status === 'ready_to_move' ? 'Ready to Move' : 'Under Construction'}
            </span>
          </div>

          {/* Title overlay — bottom-left */}
          <div className="absolute bottom-12 left-12 z-10 max-w-[580px]">
            <h1 className="font-headline text-4xl md:text-5xl font-light text-white leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-4 text-primary uppercase tracking-[0.2em] text-xs mt-3">
              <span>{property.locality}, Hyderabad</span>
              <span className="w-1 h-1 bg-primary" />
              <span>{formatRupeesCr(property.price)}</span>
              {property.bedrooms && (
                <>
                  <span className="w-1 h-1 bg-primary" />
                  <span>{property.bedrooms} BHK</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side thumbnails: col-span-4 */}
        <div className="hidden md:flex md:col-span-4 flex-col gap-1">
          <div className="h-1/2 overflow-hidden">
            {heroPhotos[1] ? (
              <img
                src={heroPhotos[1]}
                alt={`${property.title} — view 2`}
                className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  image
                </span>
              </div>
            )}
          </div>
          <div className="h-1/2 overflow-hidden relative bg-surface-container">
            {heroPhotos[2] ? (
              <img
                src={heroPhotos[2]}
                alt={`${property.title} — view 3`}
                className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  image
                </span>
              </div>
            )}
            {/* "View all" overlay if 4+ photos */}
            {remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                <span className="material-symbols-outlined text-3xl text-white">
                  photo_library
                </span>
                <p className="font-label text-xs text-white uppercase tracking-[0.15em]">
                  +{remainingCount} more
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 1.5: Locality Tour Video ─────────────────────────────── */}
      {property.video_url && (
        <section className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant">
          {/* iframe — col-span-8 */}
          <div className="md:col-span-8 bg-black">
            <div className="relative w-full aspect-video">
              <iframe
                src={property.video_url}
                title={`${property.locality} locality tour`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          {/* Label panel — col-span-4 */}
          <div className="md:col-span-4 bg-surface-container-low p-8 border-l border-outline-variant flex flex-col justify-center gap-4">
            <span className="font-label text-xs text-primary uppercase tracking-[0.2em]">
              Locality Tour
            </span>
            <h2 className="font-headline text-3xl font-light text-on-surface leading-snug">
              {property.locality},<br />Hyderabad
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Explore the neighbourhood — connectivity, infrastructure, nearby landmarks, and the lifestyle that comes with living here.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="material-symbols-outlined text-primary text-base">play_circle</span>
              <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.15em]">
                YouTube · Area walkthrough
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2: ROI Trajectory + AI Intelligence bento ────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant">

        {/* ROI Trajectory — col-span-8 */}
        <div className="md:col-span-8 bg-surface-container-low p-10 border-r border-outline-variant">
          <span className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-2 block">
            Performance Analysis
          </span>
          <h2 className="font-headline text-3xl font-light text-on-surface">
            ROI Trajectory
          </h2>

          <PriceSparkline roi={property.roi_estimate_3yr} />

          <div className="grid grid-cols-3 gap-8 md:gap-12 mt-8">
            <div>
              <p className="font-label text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1">
                3Y ROI Estimate
              </p>
              <p className="font-headline text-2xl text-secondary">
                +{property.roi_estimate_3yr}%
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1">
                Price / sqft
              </p>
              <p className="font-headline text-2xl text-on-surface">
                ₹{pricePerSqft}
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1">
                Risk Score
              </p>
              <p
                className={
                  risk === 'Low'
                    ? 'font-headline text-2xl text-secondary'
                    : risk === 'Medium'
                    ? 'font-headline text-2xl text-primary'
                    : 'font-headline text-2xl text-error'
                }
              >
                {property.risk_score}
                <span className="font-body text-sm text-on-surface-variant ml-1">
                  / 100
                </span>
              </p>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-10 border border-outline-variant">
            {[
              {
                icon: 'straighten',
                label: 'Area',
                value: `${property.area_sqft.toLocaleString('en-IN')} sqft`,
              },
              {
                icon: 'bed',
                label: 'Bedrooms',
                value: property.bedrooms ? `${property.bedrooms} BHK` : 'N/A',
              },
              {
                icon: 'bathroom',
                label: 'Bathrooms',
                value: property.bathrooms?.toString() ?? 'N/A',
              },
              {
                icon: 'calendar_today',
                label: 'Listed',
                value: formatDate(property.published_at),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container p-4 flex flex-col gap-2"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  {stat.icon}
                </span>
                <p className="font-headline text-base text-on-surface">{stat.value}</p>
                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Intelligence Brief — col-span-4 */}
        <div className="md:col-span-4 bg-primary text-on-primary p-8 flex flex-col gap-4 relative overflow-hidden">
          <span className="font-label text-xs uppercase tracking-[0.2em] opacity-70 block">
            AI Intelligence Brief
          </span>
          <h3 className="font-headline text-3xl font-light">Investment Outlook</h3>

          {property.ai_analysis ? (
            <>
              <div className="mt-2">
                <p className="font-label text-[10px] uppercase tracking-[0.1em] opacity-60 mb-1">
                  AI Score
                </p>
                <p className="font-headline text-5xl font-light">
                  {property.ai_analysis.overall_score}
                  <span className="text-2xl opacity-60">/10</span>
                </p>
              </div>
              <p className="font-body text-sm leading-relaxed opacity-90 mt-2 flex-1">
                {property.ai_analysis.investment_recommendation}
              </p>
              <div className="mt-auto pt-4 border-t border-on-primary/20">
                <p className="font-label text-[10px] uppercase tracking-[0.1em] opacity-60 mb-1">
                  Best Suited For
                </p>
                <p className="font-body text-sm opacity-90">
                  {property.ai_analysis.best_suited_for}
                </p>
              </div>
            </>
          ) : (
            <p className="font-body text-sm opacity-70 leading-relaxed mt-4">
              AI analysis will appear here once generated (runs daily).
            </p>
          )}

          {/* Decorative icon */}
          <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[180px] opacity-10 select-none">
            psychology
          </span>
        </div>
      </section>

      {/* ── Section 3: About + Amenities + Builder/RERA ──────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant">

        {/* About + Amenities — col-span-8 */}
        <div className="md:col-span-8 p-10 border-r border-outline-variant space-y-10">

          {/* Description */}
          <div>
            <span className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-4 block">
              About This Property
            </span>
            <p className="font-body text-sm text-on-surface leading-relaxed max-w-prose">
              {property.description}
            </p>
          </div>

          {/* Amenities grid */}
          {property.amenities.length > 0 && (
            <div>
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-6 block">
                Amenities
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px border border-outline-variant">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="bg-surface-container p-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">
                      {amenityIcon(amenity)}
                    </span>
                    <span className="font-body text-xs text-on-surface leading-snug">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Builder + RERA — col-span-4 */}
        <div className="md:col-span-4 p-8 flex flex-col gap-6">

          {/* Builder card */}
          <div className="bg-surface-container-high p-6 border border-outline-variant">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mb-3">
              Developer
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  business
                </span>
              </div>
              <p className="font-headline text-lg text-on-surface leading-tight">
                {property.builder_name}
              </p>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="font-label text-xs">{property.locality}, {property.city}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant mt-1.5">
              <span className="material-symbols-outlined text-sm">pin_drop</span>
              <span className="font-label text-xs">{property.pincode}</span>
            </div>
          </div>

          {/* Contact card */}
          <div className="bg-surface-container-high p-6 border border-outline-variant">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mb-3">
              Contact
            </p>
            <a
              href="tel:9642917777"
              className="flex items-center gap-3 mb-3 hover:text-primary transition-colors group"
            >
              <div className="w-8 h-8 bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:text-primary">call</span>
              </div>
              <span className="font-label text-sm text-on-surface">9642917777</span>
            </a>
            <a
              href="mailto:nalluruhaneel@gmail.com"
              className="flex items-center gap-3 hover:text-primary transition-colors group"
            >
              <div className="w-8 h-8 bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:text-primary">mail</span>
              </div>
              <span className="font-label text-sm text-on-surface">nalluruhaneel@gmail.com</span>
            </a>
          </div>

          {/* RERA card */}
          <div className="bg-surface-container-high p-6 border border-outline-variant">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mb-3">
              RERA Registration
            </p>
            <div
              className={
                property.rera_status === 'verified'
                  ? 'flex items-center gap-2 bg-secondary-container px-4 py-3 mb-4'
                  : property.rera_status === 'not_registered' || property.rera_status === 'flagged'
                  ? 'flex items-center gap-2 bg-error-container px-4 py-3 mb-4'
                  : 'flex items-center gap-2 bg-surface-container px-4 py-3 mb-4 border border-outline-variant'
              }
            >
              <span
                className={
                  property.rera_status === 'verified'
                    ? 'material-symbols-outlined text-secondary text-base'
                    : property.rera_status === 'not_registered' || property.rera_status === 'flagged'
                    ? 'material-symbols-outlined text-on-error-container text-base'
                    : 'material-symbols-outlined text-on-surface-variant text-base'
                }
              >
                {property.rera_status === 'verified'
                  ? 'verified'
                  : property.rera_status === 'pending'
                  ? 'pending'
                  : property.rera_status === 'not_registered'
                  ? 'block'
                  : property.rera_status === 'unknown'
                  ? 'help'
                  : 'warning'}
              </span>
              <span
                className={
                  property.rera_status === 'verified'
                    ? 'font-label text-xs text-on-secondary-container uppercase tracking-[0.1em]'
                    : property.rera_status === 'not_registered' || property.rera_status === 'flagged'
                    ? 'font-label text-xs text-on-error-container uppercase tracking-[0.1em]'
                    : 'font-label text-xs text-on-surface-variant uppercase tracking-[0.1em]'
                }
              >
                {property.rera_status === 'verified'
                  ? 'RERA Verified'
                  : property.rera_status === 'pending'
                  ? 'Verification Pending'
                  : property.rera_status === 'not_registered'
                  ? 'Not RERA Registered'
                  : property.rera_status === 'unknown'
                  ? 'Verification Pending (Auto-checking nightly)'
                  : 'RERA Flagged'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">tag</span>
              <span className="font-label text-xs font-mono">{property.rera_number}</span>
            </div>
          </div>

          {/* Property type badge */}
          <div className="bg-surface-container p-4 border border-outline-variant flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">
              {property.property_type === 'residential'
                ? 'home'
                : property.property_type === 'commercial'
                ? 'store'
                : 'landscape'}
            </span>
            <div>
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">
                Property Type
              </p>
              <p className="font-body text-sm text-on-surface capitalize">
                {property.property_type}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: AI Advantages / Disadvantages ─────────────────────── */}
      {property.ai_analysis ? (
        <AiAnalysisSection
          analysis={property.ai_analysis}
          analyzedAt={property.ai_analyzed_at}
        />
      ) : (
        <section className="bg-surface-container-low px-8 py-12 border-b border-outline-variant flex items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-3xl">psychology</span>
          <p className="font-body text-sm">
            AI analysis will appear here once generated (runs daily).
          </p>
        </section>
      )}

      {/* ── Section 5: Price Trend Chart ─────────────────────────────────── */}
      <PriceTrendChart
        pricePerSqft={Math.round(property.price_per_sqft)}
        roiEstimate3yr={property.roi_estimate_3yr}
        locality={property.locality}
      />

      {/* ── Section 6: ROI Calculator ─────────────────────────────────────── */}
      <RoiCalculator
        price={property.price}
        roiEstimate3yr={property.roi_estimate_3yr}
        riskScore={property.risk_score}
      />

      {/* ── Section 7: Map ────────────────────────────────────────────────── */}
      <section className="border-b border-outline-variant">
        <div className="px-8 pt-8 pb-4">
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-[0.2em] mb-2 block">
            Location
          </span>
          <h2 className="font-headline text-2xl font-light text-on-surface">
            {property.locality}, {property.city}
          </h2>
        </div>
        <div className="h-80">
          <PropertyMap
            properties={[property]}
            center={[property.lat, property.lng]}
            zoom={15}
          />
        </div>
      </section>

      {/* ── Section 8: Action bar ─────────────────────────────────────────── */}
      <section className="bg-surface-container-low px-6 md:px-10 py-8 border-b border-outline-variant">
        <div className="max-w-screen-lg mx-auto">
          {/* Price header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">
                Asking Price
              </p>
              <p className="font-headline text-4xl font-light text-on-surface">
                {formatRupeesCr(property.price)}
              </p>
              <p className="font-body text-xs text-on-surface-variant mt-1">
                {formatRupees(property.price)} total
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
                  Risk
                </p>
                <p
                  className={
                    risk === 'Low'
                      ? 'font-headline text-xl text-secondary'
                      : risk === 'Medium'
                      ? 'font-headline text-xl text-primary'
                      : 'font-headline text-xl text-error'
                  }
                >
                  {risk}
                </p>
              </div>
              {property.ai_analysis && (
                <div>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
                    AI Score
                  </p>
                  <p className="font-headline text-xl text-on-surface">
                    {property.ai_analysis.overall_score}/10
                  </p>
                </div>
              )}
            </div>
          </div>

          <ActionBar
            property={property}
            onSave={handleSave}
            isSaving={addToPortfolio.isPending}
            onCompare={handleCompare}
            isLoggedIn={!!token}
          />
        </div>
      </section>

      {/* ── Sticky mobile action bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface-container-low border-t border-outline-variant px-4 py-3">
        <ActionBar
          property={property}
          onSave={handleSave}
          isSaving={addToPortfolio.isPending}
          onCompare={handleCompare}
          isLoggedIn={!!token}
        />
      </div>

      {/* Spacer so sticky bar doesn't overlap last section on mobile */}
      <div className="h-24 md:hidden" />

      {/* ── Floating Chat Widget ──────────────────────────────────────────── */}
      <ChatWidget />
    </div>
  );
}
