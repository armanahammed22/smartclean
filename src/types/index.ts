export interface Product {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  description: string;
  shortDescription: string;
  imageUrl: string;
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  brand?: string;
  stockQuantity: number;
  sku?: string;
  type?: 'product';
  status: 'Active' | 'Inactive';
  onSale?: boolean;
  features?: string[];
  specs?: { label: string; value: string }[];
}

export interface MarketingOffer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  placement: 'top' | 'middle' | 'before_products' | 'after_products';
  enabled: boolean;
  productIds?: string[];
  serviceIds?: string[];
}

export interface MarketingCampaign {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  startDate: string;
  endDate: string;
  type: 'flat_discount' | 'percent_discount' | 'free_gift' | 'lucky_draw';
  terms: string;
  enabled: boolean;
  productIds?: string[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
  itemType: 'product' | 'service';
}

export interface Service {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  icon?: string;
  basePrice: number;
  displayPrice?: string;
  imageUrl?: string;
  type?: 'service';
  status: 'Active' | 'Inactive';
  duration?: string;
}

export interface SubService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  mainServiceId: string;
  imageUrl?: string;
  type?: 'sub_service';
  status?: 'Active' | 'Inactive';
}
