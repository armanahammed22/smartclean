"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
    search_placeholder: "পণ্য বা সার্ভিস খুঁজুন...",
    nav_offers: "অফারসমূহ",
    nav_menu: "মেনু",
    nav_categories: "ক্যাটাগরি",
    portal_access: "পোর্টাল অ্যাক্সেস",
    get_inquiry: "ইনকোয়ারি করুন",
    personal_dashboard: "পার্সোনাল ড্যাশবোর্ড",
    service_history: "সার্ভিস হিস্ট্রি",
    admin_portal: "অ্যাডমিন পোর্টাল",
    manage_orders: "অর্ডার ম্যানেজ করুন",
    sign_out: "সাইন আউট",
    
    // Header
    all_services_title: "সব সেবা",
    all_services_subtitle: "আপনার প্রয়োজন অনুযায়ী সেবা নির্বাচন করুন",
    find_service_placeholder: "সেবা খুঁজুন...",
    cat_all: "সব",
    cat_cleaning: "ক্লিনিং সার্ভিস",
    cat_maintenance: "হোম মেইনটেইনেন্স",
    cat_repair: "রিপেয়ার সার্ভিস",
    cat_tools: "সরঞ্জাম ও টুলস",

    // Admin Sidebar Items
    item_dashboard: "ড্যাশবোর্ড",
    item_reports: "রিপোর্ট",
    item_leads: "সেলস লিড",
    item_orders: "প্রোডাক্ট অর্ডার",
    item_bookings: "সার্ভিস বুকিং",
    item_tracking: "অর্ডার ট্র্যাকিং",
    item_products: "পণ্য তালিকা",
    item_categories: "ক্যাটাগরি",
    item_services: "সার্ভিস লিস্ট",
    item_subservices: "সাব সার্ভিস",
    item_areas: "সার্ভিস এরিয়া",
    item_brands: "ব্র্যান্ডস",
    item_variants: "ভ্যারিয়েন্ট",
    item_features: "কি-ফিচার",
    item_specs: "স্পেসিফিকেশন",
    item_customers: "কাস্টমার ডিরেক্টরি",
    item_staff: "স্টাফ ডিরেক্টরি",
    item_roles: "অ্যাক্সেস কন্ট্রোল",
    item_campaigns: "ক্যাম্পেইন",
    item_referrals: "রেফারাল প্রোগ্রাম",
    item_payments: "পেমেন্ট ম্যানেজমেন্ট",
    item_settings: "গ্লোবাল সেটিংস",
    item_error_logs: "সিস্টেম এরর লগ",
    item_customize: "সাইট কাস্টমাইজ",
    item_supporthub: "সাপোর্ট হাব",
    item_tickets: "সাপোর্ট টিকিট",

    // Error Management
    severity_low: "লো",
    severity_medium: "মিডিয়াম",
    severity_critical: "ক্রিটিকাল",
    status_pending: "পেন্ডিং",
    status_resolved: "সমাধান হয়েছে",
    error_something_went_wrong: "দুঃখিত, কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    mark_resolved: "সমাধান করুন",
    error_details: "এরর ডিটেইলস",
    total_unresolved: "মোট পেন্ডিং এরর",
    search_errors: "মেসেজ বা পেজ দিয়ে খুঁজুন...",

    // Products & Cart
    products_title: "সেরা পণ্যসমূহ",
    products_subtitle: "প্রফেশনাল ফলাফলের জন্য উচ্চ-ক্ষমতাসম্পন্ন সরঞ্জাম।",
    view_all: "সব দেখুন",
    add_to_cart: "কার্টে যোগ করুন",
    order_now: "অর্ডার করুন",
    cart_title: "অর্ডার তালিকা",
    empty_cart: "আপনার তালিকা খালি",
    browse_catalog: "ক্যাটালগ দেখুন",
    quantity: "পরিমাণ",
    remove: "সরিয়ে ফেলুন",
    back_to_list: "তালিকায় ফিরে যান",
    
    // Services
    services_title: "আমাদের বিশেষজ্ঞতা",
    book_now: "বুকিং দিতে চাই",
    price_from: "থেকে শুরু",
    
    // Checkout & Summary
    order_summary: "অর্ডার সারাংশ",
    subtotal: "উপমোট",
    shipping: "শিপিং",
    total: "মোট",
    proceed_to_checkout: "চেকআউট করুন",
    checkout_title: "চেকআউট ও বুকিং",
    delivery_info: "বুকিং ও ডেলিভারি তথ্য",
    full_name: "পুরো নাম",
    phone_number: "ফোন নম্বর (আবশ্যক)",
    email_optional: "ইমেল ঠিকানা (ঐচ্ছিক)",
    delivery_address: "সেবার ঠিকানা / ডেলিভারি ঠিকানা",
    place_order: "অর্ডার সম্পন্ন করুন",
    processing: "প্রসেসিং হচ্ছে...",
    secure_checkout: "আপনার তথ্য সুরক্ষিত এবং এনক্রিপ্ট করা।",
    payment_method: "পেমেন্ট পদ্ধতি",
    
    // Order Success
    order_confirmed: "অর্ডার নিশ্চিত করা হয়েছে!",
    thank_you_order: "আপনার ক্রয়ের জন্য ধন্যবাদ। আপনার অর্ডার গ্রহণ করা হয়েছে এবং প্রসেস করা হচ্ছে।",
    order_id: "অর্ডার আইডি",
    back_to_shop: "দোকানে ফিরে যান",
    account_created: "আপনার অ্যাকাউন্ট তৈরি করা হয়েছে!",
    temp_password: "অস্থায়ী পাসওয়ার্ড",
    login_info: "ভবিষ্যতে লগইন করার জন্য এই তথ্যগুলো সংরক্ষণ করুন।",

    // UI
    cart_added: "অর্ডারে যোগ করা হয়েছে",
    cart_desc: "আইটেমটি আপনার অর্ডারের তালিকায় যোগ করা হয়েছে।",
    chat_wa: "হোয়াটসঅ্যাপে চ্যাট করুন"
  },
  en: {
    // Navbar
    nav_home: "Home",
    nav_services: "Services",
    nav_products: "Products",
    nav_account: "Account",
    nav_customize: "Customize service",
    nav_booking: "Order List",
    search_placeholder: "Search products, services...",
    nav_offers: "Offers",
    nav_menu: "Menu",
    nav_categories: "Categories",
    portal_access: "Portal Access",
    get_inquiry: "Get Inquiry",
    personal_dashboard: "Personal Dashboard",
    service_history: "Service History",
    admin_portal: "Admin Portal",
    manage_orders: "Manage Orders",
    sign_out: "Sign Out",
    
    // Header
    all_services_title: "All Services",
    all_services_subtitle: "Choose from our wide range of professional solutions",
    find_service_placeholder: "Find services or tools...",
    cat_all: "All",
    cat_cleaning: "Cleaning Services",
    cat_maintenance: "Home Maintenance",
    cat_repair: "Repair Services",
    cat_tools: "Supplies & Tools",

    // Admin Sidebar Items
    item_dashboard: "Dashboard",
    item_reports: "Reports",
    item_leads: "Sales Leads",
    item_orders: "Product Orders",
    item_bookings: "Service Bookings",
    item_tracking: "Order Tracking",
    item_products: "Products",
    item_categories: "Categories",
    item_services: "Service List",
    item_subservices: "Sub Services",
    item_areas: "Service Areas",
    item_brands: "Brands",
    item_variants: "Variants",
    item_features: "Key Features",
    item_specs: "Specifications",
    item_customers: "Customer Directory",
    item_staff: "Staff Directory",
    item_roles: "Access Control",
    item_campaigns: "Campaigns",
    item_referrals: "Referral Program",
    item_payments: "Payment Management",
    item_settings: "Global Settings",
    item_error_logs: "System Error Logs",
    item_customize: "Site Customize",
    item_supporthub: "Support Hub",
    item_tickets: "Support Tickets",

    // Error Management
    severity_low: "Low",
    severity_medium: "Medium",
    severity_critical: "Critical",
    status_pending: "Pending",
    status_resolved: "Resolved",
    error_something_went_wrong: "Sorry, something went wrong. Please try again.",
    mark_resolved: "Mark Resolved",
    error_details: "Error Details",
    total_unresolved: "Unresolved Errors",
    search_errors: "Search by message or page...",

    // Products & Cart
    products_title: "Featured Products",
    products_subtitle: "High-performance tools for professional results.",
    view_all: "View All",
    add_to_cart: "Add to Cart",
    order_now: "Order Now",
    cart_title: "Order List",
    empty_cart: "Your order list is empty",
    browse_catalog: "Browse Catalog",
    quantity: "Quantity",
    remove: "Remove",
    back_to_list: "Back to List",
    
    // Services
    services_title: "Our Expertise",
    book_now: "I want to book",
    price_from: "Starts From",
    
    // Checkout & Summary
    order_summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    proceed_to_checkout: "Proceed to Checkout",
    checkout_title: "Checkout & Booking",
    delivery_info: "Booking & Delivery Information",
    full_name: "Full Name",
    phone_number: "Phone Number (Required)",
    email_optional: "Email Address (Optional)",
    delivery_address: "Service Address / Delivery Address",
    place_order: "Place Order",
    processing: "Processing...",
    secure_checkout: "Your data is protected and encrypted.",
    payment_method: "Payment Method",

    // Order Success
    order_confirmed: "Order Confirmed!",
    thank_you_order: "Thank you for your purchase. Your order has been received and is being processed.",
    order_id: "Order ID",
    back_to_shop: "Back to Shop",
    account_created: "Your account has been created!",
    temp_password: "Temporary Password",
    login_info: "Save these details for future logins.",

    // UI
    cart_added: "Added to Order",
    cart_desc: "Item has been added to your order list.",
    chat_wa: "Chat via WhatsApp"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'bn') {
      setLanguageState(saved as Language);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  }, []);

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
