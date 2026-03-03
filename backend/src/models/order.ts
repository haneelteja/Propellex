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
  created_at: Date;
  updated_at: Date;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer_name?: string;
  customer_email?: string;
}

export interface CreateOrderDto {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
  shipping_address: string;
  notes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  shipping_address?: string;
  notes?: string;
}

export interface OrderListParams {
  limit?: number;
  after_id?: string;
  customer_id?: string;
  status?: OrderStatus;
}
