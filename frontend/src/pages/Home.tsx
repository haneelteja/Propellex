import { Link } from 'react-router-dom';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useProperties } from '@/hooks/useProperties';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { QuickPreferences } from '@/components/preferences/QuickPreferences';
import { Button } from '@/components/shared/Button';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { filters } = useFilterStore();

  const hasActiveFilter =
    !!filters.property_type || !!filters.locality || filters.price_min !== '';

  const { data: recommendations, isLoading: recoLoading } = useRecommendations(12);
  const { data: filteredProperties, isLoading: filteredLoading } = useProperties({
    enabled: hasActiveFilter,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">
            Good {getGreeting()},{' '}
            <span className="text-gold">{user?.name?.split(' ')[0] ?? 'Investor'}</span>
          </h1>
          <p className="text-white/70 text-sm mb-6">
            Your personalized real estate intelligence dashboard — Hyderabad's premium properties, scored for your goals.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/search">
              <Button variant="secondary" size="lg">
                Browse Properties
              </Button>
            </Link>
            <Link to="/shortlist">
              <Button variant="ghost" size="lg" className="border-white/40 text-white hover:bg-white/10 hover:text-white">
                My Shortlist
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Preferences + Content */}
      <div className="flex gap-6 items-start">
        {/* Quick Preferences sidebar */}
        <div className="w-56 shrink-0">
          <QuickPreferences />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {hasActiveFilter ? (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">Matching Properties</h2>
                  <p className="text-sm text-gray-500">Filtered by your preferences</p>
                </div>
                <Link to="/search" className="text-brand text-sm hover:underline">
                  Open in Search →
                </Link>
              </div>
              <PropertyGrid
                properties={filteredProperties ?? []}
                loading={filteredLoading}
                emptyMessage="No properties match the selected preferences."
              />
            </section>
          ) : (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">Recommended for You</h2>
                  <p className="text-sm text-gray-500">
                    Ranked by AI based on your preferences
                  </p>
                </div>
                <Link to="/search" className="text-brand text-sm hover:underline">
                  View all →
                </Link>
              </div>
              <PropertyGrid
                properties={recommendations ?? []}
                loading={recoLoading}
                emptyMessage="No recommendations yet. Update your preferences in Profile."
              />
            </section>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Properties Listed', value: '50+', icon: '🏢' },
          { label: 'Localities Covered', value: '8',   icon: '📍' },
          { label: 'RERA Verified',      value: '70%', icon: '✓'  },
          { label: 'Avg ROI (3yr)',      value: '13%', icon: '📈' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-navy">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
