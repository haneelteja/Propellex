import { useQuery } from '@tanstack/react-query';
import { recommendations } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserPreferences } from '@/types';

export function useRecommendations(limit = 20) {
  const user = useAuthStore((s) => s.user);
  const preferences: UserPreferences = user?.preferences ?? {} as UserPreferences;

  return useQuery({
    queryKey: ['recommendations', preferences, limit],
    queryFn: () => recommendations.getScored(preferences, limit),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
