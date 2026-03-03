// ── Domain models (mirrored from backend) ──────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer_name?: string;
  customer_email?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  shipping_address?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

// ── API response shapes ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export interface ApiError {
  error: { message: string; code: string };
}

// ── Query param types ──────────────────────────────────────────────────────────

export interface OrderListParams {
  limit?: number;
  after_id?: string;
  customer_id?: string;
  status?: OrderStatus;
}

export interface ProductListParams {
  limit?: number;
  after_id?: string;
  category?: string;
  search?: string;
  in_stock?: boolean;
}

export interface CustomerListParams {
  limit?: number;
  after_id?: string;
  search?: string;
}
