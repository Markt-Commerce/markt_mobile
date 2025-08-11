export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    discount_price: string | null;
    category: {
      id: number;
      name: string;
    };
    images: string[];
    seller_id: string;
    created_at: string;
    updated_at: string;
    in_stock: boolean;
  }
  
  export interface CreateProductRequest {
    name: string;
    description: string;
    price: string;
    discount_price?: string;
    category_id: number;
    images: File[];
    in_stock: boolean;
  }
  
  export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: string;
    discount_price?: string;
    category_id?: number;
    in_stock?: boolean;
    images?: File[]; // optional, may be re-uploaded
  }
  