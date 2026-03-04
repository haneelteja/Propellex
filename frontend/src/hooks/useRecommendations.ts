import { useQuery } from '@tanstack/react-query';
import { recommendations } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function useRecommendations(limit = 20) {
  const preferences = useAuthStore((s) => s.user?.preferences);

  return useQuery({
    queryKey: ['recommendations', preferences, limit],
    queryFn: () => recommendations.getScored(preferences!, limit),
    enabled: !!preferences,
    staleTime: 5 * 60_000,
  });
}
