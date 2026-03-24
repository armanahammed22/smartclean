
export interface Product {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  description: string;
  shortDescription: string;
  imageUrl: string;
  galleryImages?: string[];
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  brand?: string;
  stockQuantity: number;
  sku?: string;
  type?: 'product';
  status: 'Active' | 'Inactive';
  onSale?: boolean;
  isPopular?: boolean;
  isBestSelling?: boolean;
  salesCount?: number;
  features?: string[];
  specifications?: { key: string; value: string }[];
  variants?: { name: string; options: string[] }[];
  size?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LandingPageFeature {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface LandingPagePackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  isDefault: boolean;
}

export interface LandingPageAddOn {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  status: boolean;
}

export interface LandingPage {
  id: string;
  slug: string;
  type: 'product' | 'service';
  title: string;
  active: boolean;
  
  // SHARED UI
  bannerImage: string;
  heroTitle?: string;
  heroSubtitle?: string;
  phone?: string;
  
  // FEATURES GRID
  featuresTitle?: string;
  features: LandingPageFeature[];
  
  // DETAILS SECTION
  detailsTitle?: string;
  detailsText?: string;
  detailsImage?: string;
  
  // WHY CHOOSE US
  whyTitle?: string;
  whyItems: string[];
  
  // PRICING CONFIG
  discountValue: number;
  discountType: 'percent' | 'fixed';
  
  // PRODUCT MODE SPECIFIC
  productIds: string[]; // For the 8-item grid
  deliveryCharge: number;
  
  // SERVICE MODE SPECIFIC
  serviceId?: string;
  serviceImage?: string;
  packages: LandingPagePackage[];
  addOns: LandingPageAddOn[];
  additionalCharge: number;

  createdAt: string;
  updatedAt?: string;
}

export interface OrderLandingProduct {
  id: string;
  pageId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: any[];
  quantity: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalPrice: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'New' | 'Paid' | 'Processing' | 'Shipped' | 'Cancelled';
  createdAt: string;
}

export interface OrderLandingService {
  id: string;
  pageId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  package: any;
  selectedAddOns: any[];
  subtotal: number;
  discount: number;
  additionalCharge: number;
  totalPrice: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'New' | 'Paid' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  shortDescription?: string;
  icon?: string;
  basePrice: number;
  displayPrice?: string;
  imageUrl?: string;
  galleryImages?: string[];
  type?: 'service';
  status: 'Active' | 'Inactive';
  isPopular?: boolean;
  duration?: string;
  teamSize?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
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
