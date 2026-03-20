import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuthStore } from '@/store/authStore';
import { QuickPreferences } from '@/components/preferences/QuickPreferences';
import { PropertyCard } from '@/components/property/PropertyCard';
import { properties as propertiesApi } from '@/services/api';
import type { Property, ScoredProperty } from '@/types';

// ── Marquee items ────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  { icon: 'trending_up',   text: '₹450 Cr+ Managed Assets'         },
  { icon: 'percent',       text: '12.4% Avg. Rental Yield'          },
  { icon: 'location_on',   text: 'Gachibowli Top Growth Zone'       },
  { icon: 'apartment',     text: '50+ Curated Properties'           },
  { icon: 'smart_toy',     text: 'AI Strategy — Active Risk Mitigation' },
];

// ── AI Intelligence feature points ──────────────────────────────────────────

const AI_FEATURES = [
  {
    icon: 'psychology',
    heading: 'Hyper-Local Scoring',
    body: 'Every property is ranked against 14 micro-market signals — infrastructure pipeline, rental velocity, and liquidity depth.',
  },
  {
    icon: 'insights',
    heading: 'ROI Projection Engine',
    body: 'Three-year yield forecasts calibrated on historical transaction data and Hyderabad RERA filings.',
  },
  {
    icon: 'shield',
    heading: 'Risk Mitigation Layer',
    body: 'Adverse news, builder track record, and legal encumbrance checks surfaced before you commit capital.',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Top 6 featured properties — independent of filter store state
  const { data: featuredResult, isLoading: featuredLoading } = useQuery({
    queryKey: ['home-featured'],
    queryFn: () =>
      propertiesApi.search({
        query: '',
        property_type: '',
        status: '',
        locality: '',
        bedrooms: '',
        price_min: '',
        price_max: '',
        rera_status: '',
        sort: 'published_desc',
        page: 1,
        limit: 6,
      }),
    staleTime: 5 * 60_000,
  });

  const featuredProperties: Property[] = featuredResult?.data ?? [];

  // Recommendations — only fetched when logged in (hook enforces enabled: !!user)
  const { data: recoResult, isLoading: recoLoading } = useRecommendations(3);
  // ScoredProperty extends Property so the union is valid for PropertyCard
  const recommendations: ScoredProperty[] = recoResult ?? [];

  const hasPreferences =
    !!user?.preferences &&
    (user.preferences.localities?.length > 0 ||
      user.preferences.property_types?.length > 0 ||
      user.preferences.budget_max > 0);

  const handleGetStarted = () => {
    navigate(user ? '/search' : '/login');
  };

  return (
    <div className="bg-background min-h-screen">

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Layered background — gradient from surface-container-low to near-black */}
        <div className="absolute inset-0 bg-surface-container-low" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-transparent" />

        {/* Decorative vertical rule */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-outline-variant/40" />

        {/* Gold accent bar — top-right quadrant */}
        <div className="absolute top-0 right-1/3 w-px h-48 bg-primary/30" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 animate-fade-in">

              <span className="text-primary font-label text-xs uppercase tracking-[0.25em] mb-8 block">
                Hyderabad Elite Portfolio
              </span>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-headline font-light leading-[1.05] mb-8 text-on-surface">
                Sovereign
                <br />
                <span className="italic text-primary">Real Estate</span>
                <br />
                Intelligence
              </h1>

              <p className="text-lg text-on-surface-variant font-body max-w-xl mb-12 leading-relaxed">
                Curating hyper-local data and architectural excellence for the world's most discerning capital.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/search">
                  <button className="px-10 py-4 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors">
                    Explore Properties
                  </button>
                </Link>
                <Link to="/search?tab=analytics">
                  <button className="px-10 py-4 border border-outline/30 text-on-surface font-label font-bold text-xs uppercase tracking-widest hover:bg-on-surface/5 transition-colors">
                    View Analytics
                  </button>
                </Link>
              </div>

              {/* Personalised greeting chip — visible only when logged in */}
              {user && (
                <div className="mt-10 inline-flex items-center gap-3 border border-outline-variant px-5 py-3">
                  <span className="material-symbols-outlined text-primary text-base">
                    waving_hand
                  </span>
                  <span className="text-on-surface-variant font-label text-sm">
                    Good {getGreeting()},{' '}
                    <span className="text-on-surface font-semibold">
                      {user.name.split(' ')[0]}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Right column — Preferences panel when logged in */}
            {user && (
              <div className="col-span-12 lg:col-span-4 lg:col-start-9 mt-8 lg:mt-0">
                <div className="bg-surface-container border border-outline-variant p-6">
                  <p className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-4">
                    Quick Preferences
                  </p>
                  <QuickPreferences />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom fade into marquee */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── 2. Stats Marquee ─────────────────────────────────────────────── */}
      <div className="border-y border-outline-variant overflow-hidden bg-surface-container-low py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {/* Duplicate the items to create the seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 mx-10 text-on-surface-variant font-label text-sm uppercase tracking-[0.15em] shrink-0"
            >
              <span className="material-symbols-outlined text-primary text-base">
                {item.icon}
              </span>
              {item.text}
              <span className="mx-4 text-outline-variant">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. AI Market Intelligence ────────────────────────────────────── */}
      <section className="py-32 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* Left — text content */}
          <div className="col-span-12 lg:col-span-5">
            <span className="text-primary font-label text-xs uppercase tracking-[0.25em] mb-6 block">
              AI Market Intelligence
            </span>
            <h2 className="text-4xl lg:text-5xl font-headline font-light text-on-surface leading-tight mb-8">
              Capital deployed with
              <br />
              <span className="italic text-primary">surgical precision.</span>
            </h2>
            <p className="text-on-surface-variant font-body leading-relaxed mb-12">
              Propellex fuses Gemini property analysis, Claude conversational strategy, and 24-month Hyderabad price history into a unified intelligence layer — so every decision is evidence-backed.
            </p>

            <div className="space-y-8">
              {AI_FEATURES.map((feat) => (
                <div key={feat.icon} className="flex gap-5">
                  <div className="shrink-0 w-10 h-10 bg-primary-container/20 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {feat.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-on-surface font-label font-semibold text-sm mb-1">
                      {feat.heading}
                    </p>
                    <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                      {feat.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — AI recommendations or placeholder */}
          <div className="col-span-12 lg:col-span-7">
            {user ? (
              hasPreferences && recommendations.length > 0 ? (
                <div>
                  <p className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-6">
                    Recommended for You
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.slice(0, 3).map((prop) => (
                      <PropertyCard key={prop.id} property={prop} />
                    ))}
                  </div>
                  {recoLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-64 bg-surface-container animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                  <Link
                    to="/search"
                    className="mt-6 inline-flex items-center gap-2 text-primary font-label text-xs uppercase tracking-[0.2em] hover:text-primary-fixed transition-colors"
                  >
                    View all recommendations
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              ) : (
                <div className="bg-surface-container border border-outline-variant p-10 flex flex-col items-start justify-center min-h-64">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">
                    tune
                  </span>
                  <p className="text-on-surface font-headline text-lg mb-3">
                    Unlock AI Recommendations
                  </p>
                  <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-6 max-w-sm">
                    Complete your investment preferences to unlock AI-ranked property recommendations tailored to your capital goals.
                  </p>
                  <Link to="/profile">
                    <button className="px-8 py-3 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors">
                      Set Preferences
                    </button>
                  </Link>
                </div>
              )
            ) : (
              <div className="bg-surface-container border border-outline-variant p-10 flex flex-col items-start justify-center min-h-64">
                <span className="material-symbols-outlined text-primary text-3xl mb-4">
                  lock
                </span>
                <p className="text-on-surface font-headline text-lg mb-3">
                  Sign In to Activate Intelligence
                </p>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-6 max-w-sm">
                  Create a free account to receive AI-ranked properties matched against your portfolio objectives.
                </p>
                <Link to="/login">
                  <button className="px-8 py-3 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors">
                    Get Started Free
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Featured Properties Bento Grid ───────────────────────────── */}
      <section className="py-32 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-primary font-label text-xs uppercase tracking-[0.25em] mb-4 block">
                Curated Portfolio
              </span>
              <h2 className="text-4xl lg:text-5xl font-headline font-light text-on-surface leading-tight">
                Featured
                <br />
                <span className="italic text-primary">Properties</span>
              </h2>
            </div>
            <Link
              to="/search"
              className="hidden lg:inline-flex items-center gap-2 text-primary font-label text-xs uppercase tracking-[0.2em] hover:text-primary-fixed transition-colors"
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-96 bg-surface-container animate-pulse" />
              <div className="col-span-1 h-96 bg-surface-container animate-pulse" />
              <div className="col-span-1 h-64 bg-surface-container animate-pulse" />
              <div className="col-span-1 h-64 bg-surface-container animate-pulse" />
              <div className="col-span-1 h-64 bg-surface-container animate-pulse" />
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Hero card — spans 2 columns on large screens */}
              {featuredProperties[0] && (
                <div className="sm:col-span-2 lg:col-span-2">
                  <PropertyCard property={featuredProperties[0]} />
                </div>
              )}
              {/* Remaining cards — single column each */}
              {featuredProperties.slice(1).map((prop) => (
                <div key={prop.id} className="col-span-1">
                  <PropertyCard property={prop} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface-variant font-body text-sm">
              No properties available at this time.
            </div>
          )}

          <div className="mt-8 lg:hidden text-center">
            <Link to="/search">
              <button className="px-10 py-4 border border-outline/30 text-on-surface font-label font-bold text-xs uppercase tracking-widest hover:bg-on-surface/5 transition-colors">
                View All Properties
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. CTA ───────────────────────────────────────────────────────── */}
      <section className="py-32 bg-primary relative overflow-hidden">
        {/* Decorative geometry */}
        <div className="absolute top-0 right-0 w-64 h-64 border border-on-primary/10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 border border-on-primary/10 -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-headline font-light text-on-primary leading-tight mb-6">
              Secure Your Legacy in
              <br />
              Hyderabad's Future.
            </h2>
            <p className="text-on-primary/70 font-body text-base leading-relaxed mb-12">
              Join 500+ HNIs and institutional investors who trust Propellex for their most important capital decisions.
            </p>

            <div className="flex flex-wrap gap-5">
              <button
                onClick={handleGetStarted}
                className="bg-on-primary text-primary px-12 py-5 font-label font-bold text-xs uppercase tracking-[0.2em] hover:bg-on-primary/90 transition-colors"
              >
                Get Started Free
              </button>
              <Link to="/search?chat=open">
                <button className="border-2 border-on-primary text-on-primary px-12 py-5 font-label font-bold text-xs uppercase tracking-[0.2em] hover:bg-on-primary/10 transition-colors">
                  Speak with AI Strategist
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
