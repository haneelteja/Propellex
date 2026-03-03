export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  shipping_address?: string;
  total_orders: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  shipping_address?: string;
}

export interface UpdateCustomerDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  shipping_address?: string;
}

export interface CustomerListParams {
  limit?: number;
  after_id?: string;
  search?: string;
}
