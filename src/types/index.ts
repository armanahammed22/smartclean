
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  shortDescription: string;
  imageUrl: string;
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  stockQuantity: number;
  sku?: string;
  type?: 'product';
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  type: 'Size' | 'Color' | 'Storage' | 'Model';
  value: string;
  price: number;
  stockQuantity: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  status: 'Active' | 'Inactive';
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  status: 'Active' | 'Inactive';
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  status: 'Active' | 'Inactive';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
  itemType: 'product' | 'service';
  variantId?: string;
}

export interface Service {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  icon: string;
  basePrice: number;
  displayPrice: string;
  imageUrl?: string;
  type?: 'service';
  status: 'Active' | 'Inactive';
}
