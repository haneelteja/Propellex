import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolio } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { PortfolioIntent } from '@/types';

export function usePortfolio() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolio.list,
    enabled: !!token,
  });
}

export function useAddToPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ property_id, intent }: { property_id: string; intent: PortfolioIntent }) =>
      portfolio.add(property_id, intent),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });
}

export function useRemoveFromPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portfolio.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });
}
