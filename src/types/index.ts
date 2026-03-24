
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

export interface LandingPagePackage {
  id: string;
  category: 'Routine Maintenance' | 'Deep Cleaning' | 'Specialized' | 'Commercial/Office';
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  features?: string[];
  status: boolean;
  order: number;
}

export interface LandingPageAddOn {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  status: boolean;
  packageId?: string; // Optional linking to specific package
}

export interface LandingPage {
  id: string;
  slug: string;
  type: 'product' | 'service';
  title: string;
  subtitle?: string;
  offer?: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  bannerImage?: string;
  useCustomBanner?: boolean;
  videoUrl?: string;
  active: boolean;
  productId?: string; // Linked product ID
  phone?: string;
  
  // DYNAMIC HERO
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  heroCTA?: string;
  heroBanner?: string;
  
  // DYNAMIC GRID CONFIG
  showCatalogGrid?: boolean;
  catalogSource?: 'products' | 'services';
  catalogTitle?: string;
  catalogLimit?: number;

  // Grid of ingredients/features (The 5-item grid)
  ingredients?: { name: string; image: string }[];
  
  // Usage/How to eat section
  usageTitle?: string;
  usageImage?: string;
  usagePoints?: string[];
  
  // Why trust us section
  trustTitle?: string;
  trustPoints?: string[];
  
  // Storage info box
  storageText?: string;
  
  // Multi-tier pricing
  packages?: LandingPagePackage[];
  addOns?: LandingPageAddOn[];

  createdAt: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  referralCode?: string;
  referredBy?: string | null;
  totalEarnings?: number;
  role: 'customer' | 'staff' | 'admin';
  status: 'active' | 'restricted' | 'disabled' | 'banned';
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  skills: string[]; // Array of Service IDs
  rating: number;
  jobsCompleted: number;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Banned';
  updatedAt?: any;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address: string;
  items: any[];
  totalPrice: number;
  status: 'New' | 'Assigned' | 'On The Way' | 'Service Started' | 'Completed' | 'Cancelled';
  employeeId?: string;
  employeeName?: string;
  serviceId?: string; // Reference to main service for skill matching
  serviceTitle?: string;
  dateTime: string;
  timeSlot?: string;
  notes?: string;
  updatedAt?: any;
  createdAt: string;
  source?: string;
}

export interface StaffAvailability {
  uid: string;
  isOnline: boolean;
  status: 'Available' | 'Busy' | 'Offline';
  activeCity?: string;
  preferredShift?: string;
  lastLocation?: { lat: number; lng: number };
  updatedAt: any;
}

export interface StaffEarnings {
  id: string;
  staffId: string;
  bookingId: string;
  amount: number;
  type: 'commission' | 'bonus' | 'base';
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
