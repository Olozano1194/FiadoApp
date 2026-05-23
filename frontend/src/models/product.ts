export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  stock: number;
  min_stock: number;
  category?: number;
  category_name?: string;
  barcode?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: string;
  cost?: string;
  stock: number;
  min_stock: number;
  category?: number | null;
  barcode?: string;
}
