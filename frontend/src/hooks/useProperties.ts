import { useQuery } from '@tanstack/react-query';
import { properties } from '@/services/api';
import { useFilterStore } from '@/store/filterStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { PropertyFilters } from '@/types';

// Debounce only text-based fields so dropdowns stay instant
function splitFilters(filters: PropertyFilters) {
  const { query, locality, ...rest } = filters;
  return { textPart: { query, locality }, rest };
}

export function useProperties(options?: { enabled?: boolean }) {
  const { filters, page } = useFilterStore();
  const { textPart, rest } = splitFilters(filters);

  // Debounce free-text fields to avoid firing a request on every keystroke
  const debouncedText = useDebounce(textPart, 350);

  const debouncedFilters: PropertyFilters = { ...debouncedText, ...rest };

  const query = useQuery({
    queryKey: ['properties', debouncedFilters, page],
    queryFn: () => properties.search({ ...debouncedFilters, page, limit: 20 }),
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
    staleTime: 60_000, // 1 min — avoids background refetch on tab focus
  });

  return {
    data: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => properties.getById(id),
    enabled: !!id,
    staleTime: 5 * 60_000, // property detail stays fresh for 5 min
  });
}

export function usePropertyAnalysis(id: string) {
  return useQuery({
    queryKey: ['property-analysis', id],
    queryFn: () => properties.getAnalysis(id),
    enabled: !!id,
    staleTime: 10 * 60_000, // analysis is computed — cache for 10 min
  });
}
