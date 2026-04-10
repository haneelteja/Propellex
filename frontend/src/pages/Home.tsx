import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuthStore } from '@/store/authStore';
import { useNews } from '@/hooks/useNews';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Modal } from '@/components/shared/Modal';
import { PreferenceWizard } from '@/components/auth/PreferenceWizard';
import { auth } from '@/services/api';
import type { ScoredProperty, NewsArticle } from '@/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Marquee stats ─────────────────────────────────────────────────────────────
const MARQUEE = [
  { icon: 'trending_up',   text: '₹450 Cr+ Managed Assets'         },
  { icon: 'percent',       text: '12.4% Avg. Rental Yield'          },
  { icon: 'location_on',   text: 'Gachibowli Top Growth Zone'       },
  { icon: 'apartment',     text: '50+ Curated Properties'           },
  { icon: 'smart_toy',     text: 'AI Strategy — Active Risk Mitigation' },
];

export default function Home() {
  const { user, updateUser } = useAuthStore();
  const [showPrefWizard, setShowPrefWizard] = useState(false);

  const { data: recoResult, isLoading: recoLoading } = useRecommendations(6);
  const recommendations: ScoredProperty[] = recoResult ?? [];

  const { articles: newsItems } = useNews({ limit: 3 });

  const hasPreferences =
    !!user?.preferences &&
    (user.preferences.localities?.length > 0 ||
      user.preferences.property_types?.length > 0 ||
      user.preferences.budget_max > 0);

  const handlePrefComplete = async () => {
    try {
      const refreshed = await auth.getProfile();
      updateUser(refreshed);
    } catch { /* use stale state */ }
    setShowPrefWizard(false);
  };

  const sentimentIcon = (s: string) =>
    s === 'positive' ? 'trending_up' : s === 'negative' ? 'trending_down' : 'trending_flat';
  const sentimentColor = (s: string) =>
    s === 'positive' ? 'text-secondary' : s === 'negative' ? 'text-error' : 'text-on-surface-variant';

  return (
    <div className="bg-background min-h-screen pt-20">

      {/* ── 1. Welcome hero ──────────────────────────────────────────────── */}
      <section className="bg-surface-container-low border-b border-outline-variant px-6 lg:px-12 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-1">
              {getGreeting()},
            </p>
            <h1 className="text-3xl font-headline font-light text-on-surface">
              {user?.name?.split(' ')[0] ?? 'Investor'}{' '}
              <span className="italic text-primary">Dashboard</span>
            </h1>
            <p className="text-on-surface-variant font-body text-sm mt-2 max-w-md">
              Your AI-powered real estate command centre. Hyderabad's elite properties, curated for your capital goals.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPrefWizard(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface-variant text-xs font-label uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Edit Preferences
            </button>
            <Link
              to="/search"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-xs font-label font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              Discover Properties
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Stats marquee ─────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant overflow-hidden bg-surface-container py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 mx-10 text-on-surface-variant font-label text-xs uppercase tracking-[0.15em] shrink-0"
            >
              <span className="material-symbols-outlined text-primary text-sm">{item.icon}</span>
              {item.text}
              <span className="mx-4 text-outline-variant">|</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-14">

        {/* ── 3. Recommendations ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-2 block">
                AI-Matched
              </span>
              <h2 className="text-2xl font-headline font-light text-on-surface">
                Recommended for <span className="italic text-primary">You</span>
              </h2>
            </div>
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1.5 text-primary font-label text-xs uppercase tracking-[0.15em] hover:opacity-70 transition-opacity"
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {!hasPreferences ? (
            <div className="bg-surface-container border border-outline-variant p-8 flex flex-col items-start gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">tune</span>
              <div>
                <p className="font-headline text-base text-on-surface mb-1">Set your preferences to unlock AI recommendations</p>
                <p className="text-sm text-on-surface-variant">Tell us your budget, localities, and risk appetite — we'll rank every property against your goals.</p>
              </div>
              <button
                onClick={() => setShowPrefWizard(true)}
                className="px-6 py-2.5 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Set Preferences
              </button>
            </div>
          ) : recoLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container border border-outline-variant p-8 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-3 block opacity-40">home_search</span>
              <p className="text-sm text-on-surface-variant">No matching properties found. Try adjusting your preferences.</p>
              <button onClick={() => setShowPrefWizard(true)} className="mt-4 text-primary text-xs font-label uppercase tracking-widest hover:underline">
                Update Preferences
              </button>
            </div>
          )}
        </section>

        {/* ── 4. Market Intelligence teaser ───────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-2 block">
                Live Intelligence
              </span>
              <h2 className="text-2xl font-headline font-light text-on-surface">
                Market <span className="italic text-primary">Pulse</span>
              </h2>
            </div>
            <Link
              to="/intelligence"
              className="hidden sm:flex items-center gap-1.5 text-primary font-label text-xs uppercase tracking-[0.15em] hover:opacity-70 transition-opacity"
            >
              Full feed
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {newsItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {newsItems.map((article: NewsArticle) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-surface-container border border-outline-variant p-5 flex flex-col gap-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                      {article.source}
                    </span>
                    <span className={`material-symbols-outlined text-[16px] ${sentimentColor(article.sentiment)}`}>
                      {sentimentIcon(article.sentiment)}
                    </span>
                  </div>
                  <p className="font-body text-sm text-on-surface leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  {article.localities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {article.localities.slice(0, 2).map((l: string) => (
                        <span key={l} className="text-[10px] font-label bg-surface-container-high text-on-surface-variant px-2 py-0.5">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container border border-outline-variant p-8 flex items-center gap-5">
              <span className="material-symbols-outlined text-primary text-3xl">newspaper</span>
              <div>
                <p className="font-headline text-base text-on-surface mb-1">Intelligence feed loading…</p>
                <p className="text-sm text-on-surface-variant">Market news refreshes every 4 hours from curated Hyderabad real estate sources.</p>
              </div>
              <Link to="/intelligence" className="ml-auto px-4 py-2 border border-outline-variant text-xs font-label text-on-surface-variant uppercase tracking-widest hover:border-primary hover:text-primary transition-colors shrink-0">
                Open Feed
              </Link>
            </div>
          )}
        </section>

        {/* ── 5. About Propellex ──────────────────────────────────────────── */}
        <section className="bg-surface-container border border-outline-variant p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-4 block">
                About Propellex
              </span>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-4">
                Sovereign real estate intelligence,<br />
                <span className="italic text-primary">built for Hyderabad's elite.</span>
              </h2>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-6">
                Propellex fuses AI-powered property analysis, live RERA verification, and conversational investment strategy into a single intelligence layer. Every property is scored across 14 micro-market signals — from infrastructure pipelines to rental velocity — so your capital moves with precision.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: 'smart_toy',     label: 'AI Analysis',        desc: 'Claude + Gemini powered' },
                  { icon: 'verified',      label: 'RERA Verified',      desc: 'Auto-checked nightly'     },
                  { icon: 'newspaper',     label: 'Live Intelligence',   desc: 'Hyderabad market news'    },
                  { icon: 'compare',       label: 'Property Compare',    desc: 'Side-by-side AI ranking' },
                  { icon: 'savings',       label: 'ROI Projections',     desc: '3-year yield forecasts'   },
                  { icon: 'shield',        label: 'Risk Scoring',        desc: '0–100 risk index'         },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[16px]">{f.icon}</span>
                    </div>
                    <div>
                      <p className="text-on-surface font-label text-xs font-semibold">{f.label}</p>
                      <p className="text-on-surface-variant text-[10px]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-3 justify-center">
              <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-1">Quick Actions</p>
              {[
                { to: '/search',       icon: 'search',          label: 'Discover Properties' },
                { to: '/intelligence', icon: 'newspaper',        label: 'Market Intelligence' },
                { to: '/shortlist',    icon: 'favorite',         label: 'My Portfolio'        },
                { to: '/profile',      icon: 'manage_accounts',  label: 'My Profile'          },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-3 px-4 py-3 border border-outline-variant text-on-surface-variant text-sm font-label hover:border-primary hover:text-on-surface transition-colors group"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary group-hover:text-primary">{a.icon}</span>
                  {a.label}
                  <span className="material-symbols-outlined text-[14px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </Link>
              ))}
              <button
                onClick={() => setShowPrefWizard(true)}
                className="flex items-center gap-3 px-4 py-3 border border-primary/30 text-primary text-sm font-label hover:bg-primary/5 transition-colors group"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Update Preferences
                <span className="material-symbols-outlined text-[14px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ── Preference wizard modal ──────────────────────────────────────── */}
      <Modal
        open={showPrefWizard}
        onClose={() => setShowPrefWizard(false)}
        title="Update Investment Preferences"
        className="max-w-md"
      >
        <PreferenceWizard onComplete={handlePrefComplete} />
      </Modal>
    </div>
  );
}
