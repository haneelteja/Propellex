import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PriceTier {
  label: string;
  min: number; // rupees — same unit as filterStore price_min/price_max
  max: number; // rupees
}

export const DEFAULT_TIERS: PriceTier[] = [
  { label: '₹10L – ₹50L', min: 1_000_000,  max: 5_000_000  },
  { label: '₹50L – ₹1Cr', min: 5_000_000,  max: 10_000_000 },
  { label: '₹1Cr – ₹5Cr', min: 10_000_000, max: 50_000_000 },
];

interface PreferenceStore {
  tiers: PriceTier[];
  setTiers: (tiers: PriceTier[]) => void;
  resetTiers: () => void;
}

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      tiers: DEFAULT_TIERS,
      setTiers: (tiers) => set({ tiers }),
      resetTiers: () => set({ tiers: DEFAULT_TIERS }),
    }),
    { name: 'propellex_pref_tiers' },
  ),
);
