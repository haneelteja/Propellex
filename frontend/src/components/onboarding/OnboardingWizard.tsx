import { useState } from 'react';
import { auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserPreferences, PropertyType, RiskAppetite, UserType } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const INVESTOR_TYPES: { value: UserType; label: string; desc: string }[] = [
  { value: 'resident_hni',   label: 'Resident HNI',      desc: 'High net-worth individual based in India' },
  { value: 'nri',            label: 'NRI',                desc: 'Non-resident Indian investor' },
  { value: 'institutional',  label: 'Institutional',      desc: 'Family office, fund, or corporate entity' },
  { value: 'home_buyer',     label: 'Home Buyer',         desc: 'Primary or second home purchase' },
];

const LOCALITIES = [
  'Gachibowli', 'Kondapur', 'Madhapur', 'HITEC City', 'Banjara Hills',
  'Jubilee Hills', 'Kokapet', 'Nanakramguda', 'Puppalaguda', 'Manikonda',
  'Narsingi', 'Financial District', 'Serilingampally', 'Miyapur', 'Kukatpally',
];

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial'  },
  { value: 'plot',        label: 'Plot / Land' },
];

const RISK_OPTIONS: { value: RiskAppetite; label: string; desc: string }[] = [
  { value: 'low',    label: 'Conservative', desc: 'RERA verified, established builders, stable micro-markets' },
  { value: 'medium', label: 'Balanced',     desc: 'Mix of ready-to-move and high-growth under-construction' },
  { value: 'high',   label: 'Aggressive',   desc: 'Emerging localities, high ROI potential, higher risk' },
];

const TOTAL_STEPS = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
        selected
          ? 'border-primary bg-primary/10 text-on-surface'
          : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
      }`}
    >
      <span className="font-label font-semibold text-sm block">{label}</span>
      {desc && <span className="text-xs mt-0.5 block opacity-70">{desc}</span>}
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-label font-semibold border transition-colors duration-150 ${
        selected
          ? 'border-primary bg-primary text-on-primary'
          : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const { updateUser } = useAuthStore();

  const [step, setStep]           = useState(1);
  const [saving, setSaving]       = useState(false);

  // Step 1 — investor type
  const [userType, setUserType]   = useState<UserType>('resident_hni');

  // Step 2 — budget
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Step 3 — localities
  const [localities, setLocalities] = useState<string[]>([]);

  // Step 4 — property types
  const [propTypes, setPropTypes] = useState<PropertyType[]>(['residential']);

  // Step 5 — ROI + risk
  const [roiTarget, setRoiTarget]     = useState('12');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('medium');

  const toggleLocality = (l: string) =>
    setLocalities((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const togglePropType = (t: PropertyType) =>
    setPropTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const canProceed = () => {
    if (step === 2) {
      const min = parseFloat(budgetMin);
      const max = parseFloat(budgetMax);
      if (!budgetMin || !budgetMax || isNaN(min) || isNaN(max) || min < 0 || max <= min) return false;
    }
    if (step === 3 && localities.length === 0) return false;
    if (step === 4 && propTypes.length === 0) return false;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const preferences: UserPreferences = {
        budget_min:      Math.round(parseFloat(budgetMin) * 10_000_000),
        budget_max:      Math.round(parseFloat(budgetMax) * 10_000_000),
        localities,
        property_types:  propTypes,
        roi_target:      parseFloat(roiTarget) || 12,
        risk_appetite:   riskAppetite,
      };
      const updated = await auth.updateProfile({ user_type: userType, preferences });
      updateUser(updated);
      onComplete();
    } catch {
      // If save fails, still let them proceed — they can update from Profile
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-surface-container border border-outline-variant">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-outline-variant">
          <span className="text-primary font-label text-xs uppercase tracking-[0.25em] block mb-2">
            Step {step} of {TOTAL_STEPS}
          </span>
          {/* Progress bar */}
          <div className="w-full h-px bg-outline-variant mt-3">
            <div
              className="h-px bg-primary transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 py-6 min-h-[320px]">

          {/* Step 1 — Investor type */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-1">
                Welcome to Propellex
              </h2>
              <p className="text-on-surface-variant font-body text-sm mb-6">
                Tell us about yourself so we can tailor your experience.
              </p>
              <div className="space-y-2">
                {INVESTOR_TYPES.map((t) => (
                  <Toggle
                    key={t.value}
                    label={t.label}
                    desc={t.desc}
                    selected={userType === t.value}
                    onClick={() => setUserType(t.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Budget */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-1">
                Investment Budget
              </h2>
              <p className="text-on-surface-variant font-body text-sm mb-6">
                Enter your budget range in Crore (₹).
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5 font-label">
                    Minimum Budget (₹ Cr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 1.5"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5 font-label">
                    Maximum Budget (₹ Cr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 5"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                {budgetMin && budgetMax && parseFloat(budgetMax) <= parseFloat(budgetMin) && (
                  <p className="text-error text-xs font-label">Maximum must be greater than minimum.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Localities */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-1">
                Preferred Localities
              </h2>
              <p className="text-on-surface-variant font-body text-sm mb-6">
                Select one or more areas in Hyderabad you're interested in.
              </p>
              <div className="flex flex-wrap gap-2">
                {LOCALITIES.map((l) => (
                  <Chip
                    key={l}
                    label={l}
                    selected={localities.includes(l)}
                    onClick={() => toggleLocality(l)}
                  />
                ))}
              </div>
              {localities.length === 0 && (
                <p className="text-on-surface-variant text-xs font-label mt-4">
                  Select at least one locality.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Property types */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-1">
                Property Types
              </h2>
              <p className="text-on-surface-variant font-body text-sm mb-6">
                What kind of properties are you interested in?
              </p>
              <div className="space-y-2">
                {PROPERTY_TYPES.map((t) => (
                  <Toggle
                    key={t.value}
                    label={t.label}
                    selected={propTypes.includes(t.value)}
                    onClick={() => togglePropType(t.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — ROI + Risk */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-headline font-light text-on-surface mb-1">
                Investment Strategy
              </h2>
              <p className="text-on-surface-variant font-body text-sm mb-6">
                Define your return expectations and risk tolerance.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5 font-label">
                    3-Year ROI Target (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={roiTarget}
                    onChange={(e) => setRoiTarget(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-3 font-label">
                    Risk Appetite
                  </label>
                  <div className="space-y-2">
                    {RISK_OPTIONS.map((r) => (
                      <Toggle
                        key={r.value}
                        label={r.label}
                        desc={r.desc}
                        selected={riskAppetite === r.value}
                        onClick={() => setRiskAppetite(r.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-on-surface-variant font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className="px-8 py-3 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="px-8 py-3 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
