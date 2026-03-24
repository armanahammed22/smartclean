
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, Product, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';
import { trackEvent } from '@/lib/tracking';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Product | Service, quantity?: number, showToast?: boolean) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const addToCart = useCallback((item: Product | Service, quantity = 1, showToast = true) => {
    const isService = 'basePrice' in item;
    const price = isService ? (item as Service).basePrice : (item as Product).price;
    const name = isService ? (item as Service).title : (item as Product).name;
    const category = isService ? t('services_title') : (item as Product).category;
    const imageUrl = isService ? (item as Service).imageUrl || '' : (item as Product).imageUrl;

    // TRACK: AddToCart
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
        quantity, 
        imageUrl, 
        category,
        itemType: isService ? 'service' : 'product'
      }];
    });
    
    if (showToast) {
      toast({
        title: "অর্ডার তালিকায় যুক্ত হয়েছে",
        description: `${name} সফলভাবে যুক্ত করা হয়েছে।`,
      });
    }
  }, [toast, t]);

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
