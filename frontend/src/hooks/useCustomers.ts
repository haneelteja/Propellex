import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services/api';
import type { CustomerListParams } from '@/types';

const CUSTOMERS_KEY = 'customers';

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'list', params],
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'detail', id],
    queryFn: () => customersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY, 'list'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof customersApi.update>[1] }) =>
      customersApi.update(id, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY, 'list'] });
      qc.setQueryData([CUSTOMERS_KEY, 'detail', updated.id], updated);
    },
  });
}
