import { useQuery } from '@tanstack/react-query';
import { news } from '@/services/api';

interface NewsParams {
  locality?: string;
  sentiment?: string;
  page?: number;
  limit?: number;
}

export function useNews(params: NewsParams = {}) {
  const query = useQuery({
    queryKey: ['news', params],
    queryFn: () => news.list(params),
    placeholderData: (prev) => prev,
    staleTime: 10 * 60_000, // 10 min — news doesn't change that fast
  });

  return {
    articles: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

export function useLocalitySentiment() {
  return useQuery({
    queryKey: ['news-sentiment'],
    queryFn: () => news.sentimentSummary(),
    staleTime: 30 * 60_000,
  });
}

export function useNewsLocalities() {
  return useQuery({
    queryKey: ['news-localities'],
    queryFn: () => news.localities(),
    staleTime: 60 * 60_000,
  });
}
