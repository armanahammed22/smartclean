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
  serviceId?: string;
  productId?: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  status: 'Pending' | 'Approved';
  isFeatured?: boolean;
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
  beforeAfterImages?: { url: string; tag: 'Before' | 'After' }[];
  type: 'service';
  status: 'Active' | 'Inactive';
  isPopular?: boolean;
  duration?: string;
  teamSize?: string;
  rating?: number;
  badgeText?: string;
  pricingType: 'fixed' | 'sqft' | 'quantity';
  sqftOptions?: { label: string; price: number }[];
  included?: string[];
  notIncluded?: string[];
  features?: { icon: string; title: string; desc: string }[];
  isBookingEnabled?: boolean;
  bookingButtonText?: string;
  reviewsEnabled?: boolean;
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
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  serviceId?: string;
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

export interface CustomRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: string[]; 
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

export interface LedgerEntry {
  id: string;
  type: "income" | "expense";
  category: 
    | "Staff Salary" 
    | "Material Cost" 
    | "Vendor Commission" 
    | "Partner Commission" 
    | "Service Income" 
    | "Product Income" 
    | "Project Cost" 
    | "Marketing"
    | "Transport"
    | "Rent"
    | "Other"
    | "Partner Project / Commission";
  sourceId?: string; // orderId, serviceId, projectId
  accountId?: string; // bank or cash account id
  partnerId?: string;
  partnerVendorId?: string;
  staffId?: string;
  amount: number;
  paidStatus: "Paid" | "Unpaid";
  date: string;
  notes?: string;
  createdAt: string;
}

export interface StaffSalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // month/year or daily date
  baseSalary: number;
  adjustments: number; // bonus or penalty
  totalAmount: number;
  paidStatus: "Paid" | "Unpaid";
  source: "Staff Module" | "Expenses Module";
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string; // Bank Name, Cash In Hand
  type: "Bank" | "Cash" | "Mobile Wallet";
  accountNumber?: string;
  balance: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface ProjectCosting {
  id: string;
  projectId: string; // usually a bookingId or custom project
  title: string;
  income: number;
  staffCost: number;
  materialCost: number;
  commissionCost: number;
  otherExpenses: number;
  totalExpense: number;
  netProfit: number;
  status: "In Progress" | "Completed";
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionDirection: "TheyGiveMe" | "IGiveThem";
  commissionType: "percentage" | "fixed";
  commissionRate: number;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
}

export interface PartnerProject {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  services: string[]; 
  addOns: string[];
  projectAmount: number;
  staffAssigned: {
    uid: string;
    name: string;
    role: string;
    salary: number;
  }[];
  workLocation: string;
  schedule: {
    startDate: string;
    endDate: string;
  };
  commissionDirection: "TheyGiveMe" | "IGiveThem";
  commissionAmount: number;
  paidStatus: "Paid" | "Unpaid";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
