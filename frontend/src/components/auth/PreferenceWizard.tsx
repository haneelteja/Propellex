import { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserPreferences, RiskAppetite, PropertyType } from '@/types';

interface PreferenceWizardProps {
  onComplete: () => void;
}

const LOCALITIES = [
  'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
];

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'plot', label: 'Plot' },
];

const RISK_OPTIONS: { value: RiskAppetite; label: string; desc: string }[] = [
  { value: 'low', label: 'Conservative', desc: 'RERA verified, ready-to-move' },
  { value: 'medium', label: 'Moderate', desc: 'Mix of ready & under-construction' },
  { value: 'high', label: 'Aggressive', desc: 'Under-construction, high ROI potential' },
];

type Step = 1 | 2 | 3 | 4;

export function PreferenceWizard({ onComplete }: PreferenceWizardProps) {
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>({
    budget_min: 5_000_000,
    budget_max: 30_000_000,
    localities: [],
    property_types: ['residential'],
    roi_target: 12,
    risk_appetite: 'medium',
  });

  const toggleLocality = (loc: string) => {
    setPrefs((p) => ({
      ...p,
      localities: p.localities.includes(loc)
        ? p.localities.filter((l) => l !== loc)
        : [...p.localities, loc],
    }));
  };

  const toggleType = (type: PropertyType) => {
    setPrefs((p) => ({
      ...p,
      property_types: p.property_types.includes(type)
        ? p.property_types.filter((t) => t !== type)
        : [...p.property_types, type],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const updated = await auth.updateProfile({
        name: user?.name ?? 'Investor',
        preferences: prefs,
      });
      updateUser(updated);
      onComplete();
    } catch {
      onComplete(); // proceed even on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 transition-colors ${
              s <= step ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Budget */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">What's your investment budget?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Minimum (₹)</label>
              <select
                value={prefs.budget_min}
                onChange={(e) => setPrefs((p) => ({ ...p, budget_min: Number(e.target.value) }))}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value={5_000_000}>₹50 L</option>
                <option value={10_000_000}>₹1 Cr</option>
                <option value={20_000_000}>₹2 Cr</option>
                <option value={30_000_000}>₹3 Cr</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Maximum (₹)</label>
              <select
                value={prefs.budget_max}
                onChange={(e) => setPrefs((p) => ({ ...p, budget_max: Number(e.target.value) }))}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value={15_000_000}>₹1.5 Cr</option>
                <option value={30_000_000}>₹3 Cr</option>
                <option value={50_000_000}>₹5 Cr</option>
                <option value={100_000_000}>₹10 Cr</option>
                <option value={200_000_000}>₹20 Cr+</option>
              </select>
            </div>
          </div>
          <Button className="w-full" onClick={() => setStep(2)}>
            Next →
          </Button>
        </div>
      )}

      {/* Step 2: Localities */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">Preferred localities in Hyderabad</h3>
          <p className="text-sm text-on-surface-variant">Select one or more areas</p>
          <div className="grid grid-cols-2 gap-2">
            {LOCALITIES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocality(loc)}
                className={`px-3 py-2 text-sm border transition-colors text-left ${
                  prefs.localities.includes(loc)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Property types */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">Property types of interest</h3>
          <div className="space-y-2">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => toggleType(pt.value)}
                className={`w-full px-4 py-3 text-sm border transition-colors text-left ${
                  prefs.property_types.includes(pt.value)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
              ← Back
            </Button>
            <Button onClick={() => setStep(4)} className="flex-1">
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: ROI + Risk */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">ROI target & risk profile</h3>

          <div>
            <label className="block text-sm text-on-surface-variant mb-1">
              Target ROI: <strong className="text-primary">{prefs.roi_target}%</strong> over 3 years
            </label>
            <input
              type="range"
              min={8}
              max={25}
              step={1}
              value={prefs.roi_target}
              onChange={(e) => setPrefs((p) => ({ ...p, roi_target: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>8%</span>
              <span>25%</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-on-surface-variant">Risk appetite</p>
            {RISK_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, risk_appetite: r.value }))}
                className={`w-full px-4 py-3 text-sm border transition-colors text-left ${
                  prefs.risk_appetite === r.value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                <div className="font-medium">{r.label}</div>
                <div className={`text-xs mt-0.5 ${prefs.risk_appetite === r.value ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {r.desc}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
              ← Back
            </Button>
            <Button loading={loading} onClick={handleFinish} className="flex-1">
              Finish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
