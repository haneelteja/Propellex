import type {
  Order,
  OrderWithItems,
  Product,
  Customer,
  PaginatedResponse,
  OrderListParams,
  ProductListParams,
  CustomerListParams,
} from '@/types';
import { buildQueryString } from '@/lib/utils';

const BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = await res.json() as { error?: { message: string; code: string } };
      message = body.error?.message ?? message;
      code = body.error?.code;
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: OrderListParams) =>
    request<PaginatedResponse<Order>>(`/orders${buildQueryString(params ?? {})}`),

  get: (id: string) =>
    request<OrderWithItems>(`/orders/${id}`),

  create: (body: { customer_id: string; items: { product_id: string; quantity: number }[]; shipping_address: string; notes?: string }) =>
    request<{ id: string; total_amount: number; status: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: { status?: string; shipping_address?: string; notes?: string }) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Products ──────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: ProductListParams) =>
    request<PaginatedResponse<Product>>(`/products${buildQueryString(params ?? {})}`),

  get: (id: string) =>
    request<Product>(`/products/${id}`),

  create: (body: Omit<Product, 'id' | 'is_active' | 'created_at' | 'updated_at'>) =>
    request<{ id: string }>('/products', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Pick<Product, 'name' | 'description' | 'price' | 'stock_quantity' | 'category' | 'is_active'>>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customersApi = {
  list: (params?: CustomerListParams) =>
    request<PaginatedResponse<Customer>>(`/customers${buildQueryString(params ?? {})}`),

  get: (id: string) =>
    request<Customer & { recent_orders: unknown[] }>(`/customers/${id}`),

  create: (body: Pick<Customer, 'first_name' | 'last_name' | 'email'> & { phone?: string; shipping_address?: string }) =>
    request<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Pick<Customer, 'first_name' | 'last_name' | 'phone' | 'shipping_address'>>) =>
    request<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
