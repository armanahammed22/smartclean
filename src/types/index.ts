export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  shortDescription: string;
  imageUrl: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}