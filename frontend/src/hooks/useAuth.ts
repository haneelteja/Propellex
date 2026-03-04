import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/services/api';

export function useAuth() {
  const { token, user, setAuth, logout } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await auth.getProfile();
      // Refresh user data from server (token stays the same)
      useAuthStore.getState().updateUser(profile);
      return profile;
    },
    enabled: !!token && !user,
    retry: 0,
  });

  return { token, user, isLoading, setAuth, logout };
}
