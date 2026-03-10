import { useQuery } from '@tanstack/react-query';
import { recommendations } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function useRecommendations(limit = 20) {
  const preferences = useAuthStore((s) => s.user?.preferences);

  return useQuery({
    queryKey: ['recommendations', preferences, limit],
    // preferences is guaranteed non-null here because `enabled` guards the call
    queryFn: () => recommendations.getScored(preferences!, limit),
    enabled: !!preferences && Object.keys(preferences).length > 0,
    staleTime: 5 * 60_000,
  });
}
