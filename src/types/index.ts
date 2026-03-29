
export interface Product {
  id: string;
  name: string;
  slug?: string;
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
  badgeText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'Pending' | 'Approved';
  createdAt: string;
}

export interface QNA {
  id: string;
  productId: string;
  question: string;
  answer?: string;
  userId: string;
  userName: string;
  status: 'Pending' | 'Approved';
  createdAt: string;
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
  enabled: boolean;
}

export interface LandingPage {
  id: string;
  slug: string;
  type: 'product' | 'service';
  title: string;
  active: boolean;
  bannerImage: string;
  heroTitle?: string;
  heroSubtitle?: string;
  phone?: string;
  featuresTitle?: string;
  features: LandingPageFeature[];
  detailsTitle?: string;
  detailsText?: string;
  detailsImage?: string;
  whyTitle?: string;
  whyItems: string[];
  discountValue: number;
  discountType: 'percent' | 'fixed';
  productIds: string[];
  deliveryCharge: number;
  serviceId?: string;
  serviceImage?: string;
  packages: LandingPagePackage[];
  addOns: LandingPageAddOn[];
  additionalCharge: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  title: string;
  slug?: string;
  categoryId: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  imageUrl?: string;
  galleryImages?: string[];
  type: 'service';
  status: 'Active' | 'Inactive';
  isPopular?: boolean;
  duration?: string;
  teamSize?: string;
  rating?: number;
  badgeText?: string;
  pricingType?: 'quantity' | 'sqft';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubService {
  id: string;
  mainServiceId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAddOnEnabled: boolean;
  isDefaultAddOn: boolean;
  status: 'Active' | 'Inactive';
  duration?: string;
  pricingType?: 'quantity' | 'sqft';
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  imageUrl: string;
  category: string;
  quantity: number;
  itemType: 'product' | 'service';
  selectedAddOns?: any[];
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service' | 'addon' | 'package';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  bookingId?: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string | null;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentStatus: 'Unpaid' | 'Paid' | 'Partial';
  paymentMethod?: string;
  paidAmount: number;
  dueAmount: number;
  transactionId?: string;
  createdAt: string;
  dueDate: string;
  publicLink?: string;
}

export interface AssignedEmployee {
  uid: string;
  name: string;
  role: 'leader' | 'member';
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  serviceTitle: string;
  totalPrice: number;
  status: 'New' | 'Assigned' | 'On The Way' | 'Service Started' | 'Completed' | 'Cancelled';
  assignedEmployees?: AssignedEmployee[];
  teamLeaderId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  dateTime: string;
  createdAt: string;
}

export interface TrackingConfig {
  googleMapsApiKey: string;
  trackingInterval: number; // in seconds
  isTrackingEnabled: boolean;
}

export interface CustomRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: string[]; // List of services requested
  details: string;
  requestedDate: string;
  requestedTime: string;
  staffCount: number;
  isQuotationRequested: boolean;
  status: 'Pending' | 'Quoted' | 'Approved' | 'Assigned' | 'Completed' | 'Rejected';
  price?: number;
  assignedEmployees?: AssignedEmployee[];
  teamLeaderId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  label: string;
  group: string;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
  status: 'Active' | 'Inactive';
  createdAt: string;
}
