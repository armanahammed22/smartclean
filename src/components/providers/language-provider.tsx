
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Navbar
    nav_home: "হোম",
    nav_services: "সেবা সমূহ",
    nav_products: "পণ্য",
    nav_account: "অ্যাকাউন্ট",
    nav_customize: "সার্ভিস কাস্টমাইজ করুন",
    nav_booking: "অর্ডার তালিকা",
    search_placeholder: "সার্ভিস খুঁজুন...",
    
    // Hero
    hero_title: "পরিচ্ছন্ন জীবনের জন্য স্মার্ট সমাধান",
    hero_subtitle: "বাংলাদেশে বিশেষজ্ঞ ক্লিনিং এবং রক্ষণাবেক্ষণ সেবা। হাজার হাজার মানুষের বিশ্বস্ত।",
    hero_cta: "এখনই বুক করুন",
    
    // Products & Cart
    products_title: "শীর্ষ ক্লিনিং পণ্য",
    products_subtitle: "প্রফেশনাল ফলাফলের জন্য উচ্চ-ক্ষমতাসম্পন্ন সরঞ্জাম।",
    view_all: "সব দেখুন",
    add_to_cart: "এখনই অর্ডার করুন",
    cart_title: "অর্ডার তালিকা",
    empty_cart: "আপনার তালিকা খালি",
    empty_cart_desc: "মনে হচ্ছে আপনি এখনও আপনার তালিকায় কিছু যোগ করেননি।",
    browse_catalog: "ক্যাটালগ দেখুন",
    quantity: "পরিমাণ",
    remove: "সরিয়ে ফেলুন",
    back_to_list: "তালিকায় ফিরে যান",
    
    // Services
    services_title: "আমাদের বিশেষজ্ঞতা",
    services_subtitle: "আমরা বিশেষায়িত ক্লিনিং এবং রক্ষণাবেক্ষণ সেবার একটি বিস্তৃত পরিসর প্রদান করি।",
    service_details: "বিস্তারিত",
    book_now: "বুক করুন",
    price_from: "থেকে",
    
    // Features
    features_title: "স্মার্ট ক্লিনের সুবিধা",
    features_subtitle: "কেন আমরা ১০০০+ গ্রাহকের পছন্দের তালিকায়।",
    
    // Checkout & Summary
    order_summary: "অর্ডার সারাংশ",
    subtotal: "উপমোট",
    shipping: "শিপিং",
    shipping_free: "ফ্রি",
    tax: "ট্যাক্স (আনুমানিক)",
    total: "মোট",
    proceed_to_checkout: "চেকআউট করুন",
    checkout_title: "চেকআউট",
    delivery_info: "ডেলিভারি তথ্য",
    full_name: "পুরো নাম",
    phone_number: "ফোন নম্বর",
    email_optional: "ইমেল ঠিকানা (ঐচ্ছিক)",
    delivery_address: "ডেলিভারি ঠিকানা",
    order_notes: "অর্ডার নোট (ঐচ্ছিক)",
    place_order: "অর্ডার সম্পন্ন করুন",
    processing: "প্রসেসিং হচ্ছে...",
    secure_checkout: "আপনার তথ্য সুরক্ষিত এবং এনক্রিপ্ট করা।",
    
    // Order Success
    order_confirmed: "অর্ডার নিশ্চিত করা হয়েছে!",
    thank_you_order: "আপনার ক্রয়ের জন্য ধন্যবাদ। আপনার অর্ডার গ্রহণ করা হয়েছে এবং প্রসেস করা হচ্ছে।",
    order_id: "অর্ডার আইডি",
    confirmation_email: "আপনার ইনবক্সে একটি নিশ্চিতকরণ ইমেল পাঠানো হয়েছে।",
    back_to_shop: "দোকানে ফিরে যান",
    continue_shopping: "কেনাকাটা চালিয়ে যান",

    // Footer
    footer_desc: "পুরো বাংলাদেশে প্রফেশনাল ক্লিনিং সেবার সবচেয়ে বিশ্বস্ত নাম। ১০০০+ সন্তুষ্ট গ্রাহকের বিশ্বস্ত।",
    footer_services: "সেবা সমূহ",
    footer_company: "কোম্পানি",
    footer_contact: "যোগাযোগ করুন",
    footer_address: "ওয়ারলেস গেট, মহাখালী, ঢাকা-১২১২",
    footer_hours: "শনি - বৃহস্পতি: সকাল ৮টা - রাত ৮টা",
    footer_rights: "© ২০২৬ স্মার্ট ক্লিন বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
    
    // UI
    cart_added: "অর্ডারে যোগ করা হয়েছে",
    cart_desc: "পণ্যটি আপনার অর্ডারের তালিকায় যোগ করা হয়েছে。",
    service_billing_note: "দ্রষ্টব্য: পরিষেবার পরিমাণগুলি বেস প্রাইস এবং কাজের প্রয়োজনীয়তার ভিত্তিতে পরিবর্তিত হতে পারে।"
  },
  en: {
    // Navbar
    nav_home: "Home",
    nav_services: "Services",
    nav_products: "Products",
    nav_account: "Account",
    nav_customize: "Customize service",
    nav_booking: "Order List",
    search_placeholder: "Search services...",
    
    // Hero
    hero_title: "Smart Solutions for a Clean Life",
    hero_subtitle: "Expert cleaning and maintenance services in Bangladesh. Trusted by thousands.",
    hero_cta: "Book Now",
    
    // Products & Cart
    products_title: "Top Cleaning Products",
    products_subtitle: "High-performance tools for professional results.",
    view_all: "View All",
    add_to_cart: "Order Now",
    cart_title: "Order List",
    empty_cart: "Your order list is empty",
    empty_cart_desc: "Looks like you haven't added anything to your order list yet.",
    browse_catalog: "Browse Catalog",
    quantity: "Quantity",
    remove: "Remove",
    back_to_list: "Back to List",
    
    // Services
    services_title: "Our Expertise",
    services_subtitle: "We provide a wide range of specialized cleaning and maintenance services.",
    service_details: "Details",
    book_now: "Book Now",
    price_from: "From",
    
    // Features
    features_title: "The Smart Clean Advantage",
    features_subtitle: "Why we are the preferred choice for 1000+ clients.",
    
    // Checkout & Summary
    order_summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shipping_free: "Free",
    tax: "Tax (Estimated)",
    total: "Total",
    proceed_to_checkout: "Proceed to Checkout",
    checkout_title: "Checkout",
    delivery_info: "Delivery Information",
    full_name: "Full Name",
    phone_number: "Phone Number",
    email_optional: "Email Address (Optional)",
    delivery_address: "Delivery Address",
    order_notes: "Order Notes (Optional)",
    place_order: "Place Order",
    processing: "Processing...",
    secure_checkout: "Your data is protected and encrypted.",

    // Order Success
    order_confirmed: "Order Confirmed!",
    thank_you_order: "Thank you for your purchase. Your order has been received and is being processed.",
    order_id: "Order ID",
    confirmation_email: "A confirmation email has been sent to your inbox.",
    back_to_shop: "Back to Shop",
    continue_shopping: "Continue Shopping",

    // Footer
    footer_desc: "The most trusted name for professional cleaning services across Bangladesh. Trusted by 1000+ satisfied clients.",
    footer_services: "Services",
    footer_company: "Company",
    footer_contact: "Contact Us",
    footer_address: "Wireless Gate, Mohakhali, Dhaka-1212",
    footer_hours: "Sat - Thu: 8am - 8pm",
    footer_rights: "© 2026 Smart Clean Bangladesh. All rights reserved.",
    
    // UI
    cart_added: "Added to Order",
    cart_desc: "Item has been added to your order list.",
    service_billing_note: "Note: Service amounts are base prices and may vary based on actual work requirements."
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('bn');

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
