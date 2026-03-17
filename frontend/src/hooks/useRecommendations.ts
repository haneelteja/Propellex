import { useQuery } from '@tanstack/react-query';
import { recommendations } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function useRecommendations(limit = 20) {
  const user = useAuthStore((s) => s.user);
  const preferences = user?.preferences ?? {};

  return useQuery({
    queryKey: ['recommendations', preferences, limit],
    queryFn: () => recommendations.getScored(preferences, limit),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
