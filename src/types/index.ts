
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
  size?: string;
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
  dateTime: string;
  timeSlot?: string;
  notes?: string;
  updatedAt?: any;
  createdAt: string;
}

export interface StaffAvailability {
  uid: string;
  isOnline: boolean;
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

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
  itemType: 'product' | 'service';
}
