"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CartItem, Product, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';
import { trackEvent } from '@/lib/tracking';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Product | Service, quantity?: number, showToast?: boolean) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  smartSubtotal: number;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const db = useFirestore();

  // 🛡️ Global Feature Check
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Smart Pricing Logic
  const rulesQuery = useMemoFirebase(() => db ? query(collection(db, 'smart_pricing_rules'), where('isActive', '==', true)) : null, [db]);
  const { data: activeRules } = useCollection(rulesQuery);

  const smartDiscount = useMemo(() => {
    if (!activeRules?.length) return 0;
    const now = new Date();
    const day = now.getDay(); // 5 = Fri, 6 = Sat
    const hour = now.getHours();

    let discount = 0;
    const sorted = [...activeRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
      if (rule.type === 'weekend' && (day === 5 || day === 6)) {
        discount = rule.discountPercent;
        break;
      }
      if (rule.type === 'off_peak' && (hour >= 22 || hour < 6)) {
        discount = rule.discountPercent;
        break;
      }
    }
    return discount;
  }, [activeRules]);

  const addToCart = useCallback((item: Product | Service, quantity = 1, showToast = true) => {
    const isService = 'basePrice' in item;
    const itemType = isService ? 'service' : 'product';
    
    // 🛡️ Block disabled features
    if (itemType === 'product' && settings?.productsEnabled === false) {
      toast({ variant: "destructive", title: "Action Blocked", description: "Product sales are currently offline. Please contact support." });
      return;
    }
    if (itemType === 'service' && settings?.servicesEnabled === false) {
      toast({ variant: "destructive", title: "Action Blocked", description: "Service bookings are currently offline. Please try again later." });
      return;
    }

    const price = isService ? (item as Service).basePrice : (item as Product).price;
    const regularPrice = isService ? undefined : (item as Product).regularPrice;
    const name = isService ? (item as Service).title : (item as Product).name;
    const category = isService ? t('services_title') : (item as Product).category;
    const imageUrl = isService ? (item as Service).imageUrl || '' : (item as Product).imageUrl;

    if (items.length > 0) {
      const existingType = items[0].itemType;
      if (existingType !== itemType) {
        toast({
          variant: "destructive",
          title: "Incompatible Order",
          description: existingType === 'product' 
            ? "Your cart contains products. Please clear cart to book a service." 
            : "Your cart contains services. Please clear cart to order products.",
        });
        return;
      }
    }

    trackEvent('AddToCart', {
      content_name: name,
      content_ids: [item.id],
      content_type: 'product',
      value: price * quantity,
      currency: 'BDT',
      content_category: category
    });

    setItems((prevItems) => {
      const existingItem = prevItems.find((prev) => prev.id === item.id);
      if (existingItem) {
        return prevItems.map((prev) =>
          prev.id === item.id ? { ...prev, quantity: prev.quantity + quantity } : prev
        );
      }
      return [...prevItems, { 
        id: item.id, 
        name, 
        price, 
        regularPrice,
        quantity, 
        imageUrl, 
        category,
        itemType: itemType
      }];
    });
    
    if (showToast) {
      toast({
        title: t('cart_added'),
        description: `${name} ${t('cart_desc')}`,
      });
    }
  }, [toast, t, items, settings]);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const smartSubtotal = subtotal * (1 - smartDiscount / 100);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        smartSubtotal,
        isCheckoutOpen,
        setCheckoutOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}