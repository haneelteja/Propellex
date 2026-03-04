import { create } from 'zustand';
import type { PropertyFilters } from '@/types';

const DEFAULT_FILTERS: PropertyFilters = {
  query: '',
  property_type: '',
  status: '',
  locality: '',
  bedrooms: '',
  price_min: '',
  price_max: '',
  rera_status: '',
  sort: 'published_desc',
};

interface FilterStore {
  filters: PropertyFilters;
  page: number;
  showMap: boolean;
  setFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  setPage: (page: number) => void;
  toggleMap: () => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  page: 1,
  showMap: false,

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value }, page: 1 })),

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters }, page: 1 })),

  setPage: (page) => set({ page }),

  toggleMap: () => set((s) => ({ showMap: !s.showMap })),

  reset: () => set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),
}));
