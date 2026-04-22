
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

export interface CleaningProject {
  id: string;
  clientName: string;
  location: string;
  startDate: string;
  endDate: string;
  totalArea: number;
  status: 'Active' | 'Completed' | 'On Hold';
  supervisorId?: string;
  partnerId?: string; // Connection to Partner
  partnerName?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkEntry {
  id: string;
  projectId: string;
  date: string;
  workType: 'Floor Cleaning' | 'Glass Cleaning' | 'Sofa Cleaning' | 'Deep Cleaning' | 'Toilet Cleaning' | 'Carpet Cleaning' | 'Other';
  quantity: number;
  unitType: 'Square Feet' | 'Pieces' | 'KG' | 'Feet' | 'Meter';
  workers?: string[];
  notes?: string;
  createdAt: string;
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
  regularPrice?: number;
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
  regularPrice?: number;
  description?: string;
  imageUrl?: string;
  isAddOnEnabled: boolean;
  isDefaultAddOn: boolean;
  isStandaloneEnabled?: boolean;
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
  commissionRate: number; // Percentage or fixed rate used for this project
  paidStatus: "Paid" | "Unpaid";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvancedOffer {
  id: string;
  title: string;
  type: 'buy_x_get_y' | 'bundle' | 'min_order' | 'tiered';
  status: 'Draft' | 'Live' | 'Scheduled' | 'Expired';
  targeting: string;
  rules: {
    minSpend?: number;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    buyQty?: number;
    getQty?: number;
  };
  applicableItems: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  locationIn?: { lat: number; lng: number };
  locationOut?: { lat: number; lng: number };
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'No Task';
  updatedAt: any;
  markedBy?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: 'Sick' | 'Casual' | 'Annual' | 'Emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseClaim {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  amount: number;
  description: string;
  imageUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt?: string;
}
