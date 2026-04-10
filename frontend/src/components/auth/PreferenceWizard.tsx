import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/Button';
import { auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserPreferences, RiskAppetite, PropertyType } from '@/types';

interface PreferenceWizardProps {
  onComplete: () => void;
}

// ── Budget values (Cr) — fine-grained in the 1–10 Cr sweet spot ─────────────
const BUDGET_CR = [
  0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.75,
  3, 3.25, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30,
  40, 50, 75, 100, 150, 200, 300, 500,
];
const CR_TO_PAISE = 10_000_000; // 1 Cr = ₹1,00,00,000

function crToPaise(cr: number) { return Math.round(cr * CR_TO_PAISE); }
function closestIdx(cr: number) {
  let best = 0;
  let bestDiff = Infinity;
  BUDGET_CR.forEach((v, i) => {
    const d = Math.abs(v - cr);
    if (d < bestDiff) { bestDiff = d; best = i; }
  });
  return best;
}
function fmtCr(cr: number) {
  if (cr >= 100) return `${cr} Cr`;
  if (Number.isInteger(cr)) return `${cr} Cr`;
  return `${cr} Cr`;
}

const POPULAR_PRESETS = [
  { label: '₹1–2 Cr',   min: 1,   max: 2   },
  { label: '₹2–3 Cr',   min: 2,   max: 3   },
  { label: '₹3–5 Cr',   min: 3,   max: 5   },
  { label: '₹5–10 Cr',  min: 5,   max: 10  },
  { label: '₹10–25 Cr', min: 10,  max: 25  },
  { label: '₹25 Cr+',   min: 25,  max: 500 },
];

// ── Cities + localities ───────────────────────────────────────────────────────
interface City { name: string; lat: number; lng: number; }

const CITIES: City[] = [
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  // Future: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
];

const LOCALITIES_BY_CITY: Record<string, string[]> = {
  Hyderabad: [
    'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
    'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
    'Puppalaguda', 'Manikonda', 'Narsingi', 'Financial District',
    'Serilingampally', 'Miyapur', 'Kukatpally', 'Kompally',
    'Bachupally', 'Nizampet', 'Pragathi Nagar', 'Shamshabad',
  ],
};

function nearestCity(lat: number, lng: number): City {
  let best = CITIES[0];
  let bestDist = Infinity;
  CITIES.forEach((c) => {
    const d = Math.hypot(c.lat - lat, c.lng - lng);
    if (d < bestDist) { bestDist = d; best = c; }
  });
  return best;
}

// ── Other wizard data ─────────────────────────────────────────────────────────
const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'residential', label: 'Residential', icon: 'home' },
  { value: 'commercial',  label: 'Commercial',  icon: 'business' },
  { value: 'plot',        label: 'Plot / Land', icon: 'landscape' },
];

const RISK_OPTIONS: { value: RiskAppetite; label: string; desc: string }[] = [
  { value: 'low',    label: 'Conservative', desc: 'RERA verified, ready-to-move' },
  { value: 'medium', label: 'Moderate',     desc: 'Mix of ready & under-construction' },
  { value: 'high',   label: 'Aggressive',   desc: 'Under-construction, high ROI potential' },
];

type Step = 1 | 2 | 3 | 4;

export function PreferenceWizard({ onComplete }: PreferenceWizardProps) {
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Budget indices into BUDGET_CR
  const [minIdx, setMinIdx] = useState(closestIdx(2));   // default ₹2 Cr
  const [maxIdx, setMaxIdx] = useState(closestIdx(5));   // default ₹5 Cr

  // City + locality
  const [city, setCity] = useState('Hyderabad');
  const [locating, setLocating] = useState(false);
  const [localities, setLocalities] = useState<string[]>([]);

  // Other prefs
  const [propTypes, setPropTypes] = useState<PropertyType[]>(['residential']);
  const [roiTarget, setRoiTarget] = useState(12);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('medium');

  // When city changes, reset locality selections
  useEffect(() => { setLocalities([]); }, [city]);

  const minCr = BUDGET_CR[minIdx];
  const maxCr = BUDGET_CR[maxIdx];

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setMinIdx(Math.min(v, maxIdx - 1));
  };
  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setMaxIdx(Math.max(v, minIdx + 1));
  };

  const applyPreset = (min: number, max: number) => {
    setMinIdx(closestIdx(min));
    setMaxIdx(closestIdx(max));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(c.name);
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 8000 },
    );
  };

  const toggleLocality = (loc: string) => {
    setLocalities((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    );
  };

  const toggleType = (type: PropertyType) => {
    setPropTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    const prefs: UserPreferences = {
      budget_min: crToPaise(minCr),
      budget_max: crToPaise(maxCr),
      localities,
      property_types: propTypes,
      roi_target: roiTarget,
      risk_appetite: riskAppetite,
    };
    try {
      const updated = await auth.updateProfile({ name: user?.name ?? 'Investor', preferences: prefs });
      updateUser(updated);
      onComplete();
    } catch {
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const cityLocalities = LOCALITIES_BY_CITY[city] ?? [];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 transition-colors duration-300 ${s <= step ? 'bg-primary' : 'bg-surface-container-high'}`}
          />
        ))}
      </div>

      {/* ── Step 1: Budget ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-headline font-semibold text-on-surface">Investment Budget</h3>
            <p className="text-sm text-on-surface-variant mt-1">Drag the sliders to set your range in Crore (₹).</p>
          </div>

          {/* Selected range display */}
          <div className="bg-primary/5 border border-primary/20 px-5 py-4 text-center">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Selected Range</p>
            <p className="font-headline text-2xl text-primary">
              ₹{fmtCr(minCr)} — ₹{fmtCr(maxCr)}
            </p>
          </div>

          {/* Min slider */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Minimum</span>
              <span className="text-primary font-semibold">₹{fmtCr(minCr)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={BUDGET_CR.length - 1}
              value={minIdx}
              onChange={handleMinSlider}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
          </div>

          {/* Max slider */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Maximum</span>
              <span className="text-primary font-semibold">₹{fmtCr(maxCr)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={BUDGET_CR.length - 1}
              value={maxIdx}
              onChange={handleMaxSlider}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>₹0.5 Cr</span>
              <span>₹500 Cr</span>
            </div>
          </div>

          {/* Popular presets */}
          <div>
            <p className="text-xs text-on-surface-variant mb-2">Popular ranges</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_PRESETS.map((p) => {
                const active = closestIdx(p.min) === minIdx && closestIdx(p.max) === maxIdx;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.min, p.max)}
                    className={`px-3 py-1.5 text-xs font-label border transition-colors ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" onClick={() => setStep(2)}>Next →</Button>
        </div>
      )}

      {/* ── Step 2: City + Localities ──────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-headline font-semibold text-on-surface">Preferred Localities</h3>
            <p className="text-sm text-on-surface-variant mt-1">Select your city and areas of interest.</p>
          </div>

          {/* City selector */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-on-surface-variant mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="mt-5 flex items-center gap-1.5 px-3 py-2 border border-outline-variant text-on-surface-variant text-xs font-label hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              title="Detect my location"
            >
              <span className="material-symbols-outlined text-[16px]">
                {locating ? 'progress_activity' : 'my_location'}
              </span>
              {locating ? 'Detecting…' : 'Detect'}
            </button>
          </div>

          {/* Locality grid */}
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {cityLocalities.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocality(loc)}
                className={`px-3 py-2 text-sm border transition-colors text-left ${
                  localities.includes(loc)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {localities.length === 0 && (
            <p className="text-xs text-error">Select at least one locality.</p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
            <Button
              onClick={() => { if (localities.length > 0) setStep(3); }}
              className="flex-1"
              disabled={localities.length === 0}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Property types ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">Property types of interest</h3>
          <div className="space-y-2">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => toggleType(pt.value)}
                className={`w-full px-4 py-3 text-sm border transition-colors text-left flex items-center gap-3 ${
                  propTypes.includes(pt.value)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{pt.icon}</span>
                {pt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">← Back</Button>
            <Button onClick={() => setStep(4)} className="flex-1">Next →</Button>
          </div>
        </div>
      )}

      {/* ── Step 4: ROI + Risk ─────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-semibold text-on-surface">ROI target & risk profile</h3>

          <div>
            <label className="block text-sm text-on-surface-variant mb-2">
              Target ROI:{' '}
              <strong className="text-primary">{roiTarget}%</strong> over 3 years
            </label>
            <input
              type="range"
              min={8}
              max={25}
              step={1}
              value={roiTarget}
              onChange={(e) => setRoiTarget(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>8% (Conservative)</span>
              <span>25% (Aggressive)</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-on-surface-variant">Risk appetite</p>
            {RISK_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRiskAppetite(r.value)}
                className={`w-full px-4 py-3 text-sm border transition-colors text-left ${
                  riskAppetite === r.value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                <div className="font-medium">{r.label}</div>
                <div className={`text-xs mt-0.5 ${riskAppetite === r.value ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {r.desc}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">← Back</Button>
            <Button loading={loading} onClick={handleFinish} className="flex-1">Finish</Button>
          </div>
        </div>
      )}
    </div>
  );
}
