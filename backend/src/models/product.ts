export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  category?: string;
  is_active?: boolean;
}

export interface ProductListParams {
  limit?: number;
  after_id?: string;
  category?: string;
  search?: string;
  in_stock?: boolean;
}
