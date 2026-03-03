import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import type { OrderListParams } from '@/types';

const ORDERS_KEY = 'orders';

export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'list', params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'detail', id],
    queryFn: () => ordersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, 'list'] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof ordersApi.update>[1] }) =>
      ordersApi.update(id, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, 'list'] });
      qc.setQueryData([ORDERS_KEY, 'detail', updated.id], updated);
    },
  });
}
