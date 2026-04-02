
"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';
import { trackEvent } from '@/lib/tracking';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
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
  savingsTotal: number;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();

  // 🛡️ Global Feature Check
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // 🚀 Fetch Advanced Offers
  const advancedOffersQuery = useMemoFirebase(() => db ? query(collection(db, 'advanced_offers'), where('isActive', '==', true)) : null, [db]);
  const { data: advancedOffers } = useCollection(advancedOffersQuery);

  // Smart Pricing Logic (Weekend/Off-peak)
  const rulesQuery = useMemoFirebase(() => db ? query(collection(db, 'smart_pricing_rules'), where('isActive', '==', true)) : null, [db]);
  const { data: activeRules } = useCollection(rulesQuery);

  const smartDiscount = useMemo(() => {
    if (!activeRules?.length) return 0;
    const now = new Date();
    const day = now.getDay(); 
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
    
    if (itemType === 'product' && settings?.productsEnabled === false) {
      toast({ variant: "destructive", title: "Action Blocked", description: "Product sales are currently offline." });
      return;
    }
    if (itemType === 'service' && settings?.servicesEnabled === false) {
      toast({ variant: "destructive", title: "Action Blocked", description: "Service bookings are currently offline." });
      return;
    }

    const price = isService ? (item as Service).basePrice : (item as Product).price;
    const regularPrice = isService ? (item as Service).regularPrice || (item as Service).basePrice : (item as Product).regularPrice;
    const name = isService ? (item as Service).title : (item as Product).name;
    const category = isService ? t('services_title') : (item as Product).category;
    const imageUrl = isService ? (item as Service).imageUrl || '' : (item as Product).imageUrl;

    if (items.length > 0) {
      const existingType = items[0].itemType;
      if (existingType !== itemType) {
        toast({
          variant: "destructive",
          title: "Incompatible Order",
          description: existingType === 'product' ? "Clear cart to book a service." : "Clear cart to order products.",
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
      toast({ title: t('cart_added'), description: `${name} ${t('cart_desc')}` });
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
  const subtotalRaw = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // 🎁 ADVANCED ENGINE LOGIC
  const advancedCalculations = useMemo(() => {
    let currentSubtotal = subtotalRaw;
    let extraSavings = 0;

    if (!advancedOffers) return { finalSubtotal: currentSubtotal * (1 - smartDiscount / 100), savings: 0 };

    // 1. Min Order Value Logic
    const minOrderOffer = advancedOffers.find(o => o.type === 'min_order' && currentSubtotal >= (o.rules?.minSpend || 0));
    if (minOrderOffer) {
      const discount = minOrderOffer.rules.discountType === 'percentage' 
        ? (currentSubtotal * minOrderOffer.rules.discountValue) / 100
        : minOrderOffer.rules.discountValue;
      extraSavings += discount;
    }

    // 2. Buy X Get Y logic (Simple implementation for same product)
    items.forEach(item => {
      const bogoOffer = advancedOffers.find(o => o.type === 'buy_x_get_y' && (o.rules?.buyQty || 1) <= item.quantity);
      if (bogoOffer) {
        const freeSets = Math.floor(item.quantity / (bogoOffer.rules.buyQty + bogoOffer.rules.getQty));
        if (freeSets > 0) {
          extraSavings += (item.price * freeSets * bogoOffer.rules.getQty);
        }
      }
    });

    const smartApplied = currentSubtotal * (1 - smartDiscount / 100);
    return { 
      finalSubtotal: Math.max(0, smartApplied - extraSavings), 
      savings: extraSavings 
    };
  }, [items, subtotalRaw, advancedOffers, smartDiscount]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal: subtotalRaw,
        smartSubtotal: advancedCalculations.finalSubtotal,
        savingsTotal: advancedCalculations.savings,
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
