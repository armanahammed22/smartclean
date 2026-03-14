export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  shortDescription: string;
  imageUrl: string;
  category: string;
  type?: 'product';
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

export interface CheckoutFormData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: "Layout" | "Wrench" | "Activity" | "Truck" | "ShieldCheck" | "Headphones";
  basePrice: number;
  displayPrice: string;
  type?: 'service';
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: "Truck" | "ShieldCheck" | "Headphones";
}
