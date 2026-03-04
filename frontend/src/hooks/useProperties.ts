import { useQuery } from '@tanstack/react-query';
import { properties } from '@/services/api';
import { useFilterStore } from '@/store/filterStore';

export function useProperties() {
  const { filters, page } = useFilterStore();

  const query = useQuery({
    queryKey: ['properties', filters, page],
    queryFn: () => properties.search({ ...filters, page, limit: 20 }),
    placeholderData: (prev) => prev,
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
  });
}

export function usePropertyAnalysis(id: string) {
  return useQuery({
    queryKey: ['property-analysis', id],
    queryFn: () => properties.getAnalysis(id),
    enabled: !!id,
  });
}
