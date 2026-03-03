import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import type { ProductListParams } from '@/types';

const PRODUCTS_KEY = 'products';

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'list', params],
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'detail', id],
    queryFn: () => productsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'list'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof productsApi.update>[1] }) =>
      productsApi.update(id, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'list'] });
      qc.setQueryData([PRODUCTS_KEY, 'detail', updated.id], updated);
    },
  });
}
