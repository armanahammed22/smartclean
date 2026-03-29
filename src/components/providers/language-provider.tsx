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
    nav_home: "হোম",
    nav_services: "সেবাসমূহ",
    nav_products: "পণ্যসমূহ",
    nav_account: "অ্যাকাউন্ট",
    search_placeholder: "পণ্য বা সার্ভিস খুঁজুন...",
    nav_offers: "অফারসমূহ",
    item_supporthub: "সাপোর্ট হাব",
    footer_about: "আমাদের সম্পর্কে",
    footer_services: "সার্ভিসসমূহ",
    footer_company: "কোম্পানি",
    footer_contact: "যোগাযোগ",
    footer_privacy: "প্রাইভেসি পলিসি",
    footer_terms: "শর্তাবলী",
    all_services_title: "সব সেবা",
    empty_cart: "আপনার তালিকা খালি",
    empty_cart_desc: "আপনি এখনো কোনো পণ্য বা সার্ভিস যোগ করেননি।",
    browse_catalog: "ক্যাটালগ দেখুন",
    cart_added: "তালিকায় যোগ করা হয়েছে",
    cart_desc: "আইটেমটি আপনার তালিকায় সফলভাবে যোগ করা হয়েছে।",
    book_now: "বুক করুন",
    flash_sale: "ফ্ল্যাশ সেল",
    ends_in: "শেষ হতে বাকি",
    sold: "বিক্রি",
    book: "বুকিং",
    order_summary: "অর্ডার সারাংশ",
    secure_checkout: "সুরক্ষিত চেকআউট",
    subtotal: "সাব-টোটাল",
    shipping: "শিপিং",
    shipping_free: "ফ্রি",
    total: "মোট",
    proceed_to_checkout: "চেকআউট করুন",
    delivery_info: "ডেলিভারি তথ্য",
    full_name: "আপনার পূর্ণ নাম",
    phone_number: "আপনার মোবাইল নম্বর",
    email_address: "আপনার ইমেল ঠিকানা",
    delivery_address: "আপনার বিস্তারিত ঠিকানা",
    payment_method: "পেমেন্ট পদ্ধতি",
    processing: "প্রক্রিয়াকরণ হচ্ছে...",
    order_confirmed: "অর্ডার নিশ্চিত হয়েছে!",
    thank_you_order: "আমাদের সাথে থাকার জন্য ধন্যবাদ।",
    order_id: "অর্ডার আইডি",
    back_to_shop: "শপে ফিরে যান",
    login_info: "লগইন তথ্য",
    temp_password: "অস্থায়ী পাসওয়ার্ড",
    account_created: "অ্যাকাউন্ট তৈরি হয়েছে",
    otp_sent: "ওটিপি পাঠানো হয়েছে",
    otp_verified: "ওটিপি যাচাই করা হয়েছে",
    invalid_otp: "ভুল ওটিপি",
    send_otp: "ওটিপি পাঠান",
    phone_exists_error: "এই নম্বরটি অলরেডি রেজিস্টার্ড।",
    personal_dashboard: "ব্যক্তিগত ড্যাশবোর্ড",
    portal_access: "পোর্টালে প্রবেশ",
    view_all: "সব দেখুন",
    cat_all: "সব ক্যাটাগরি",
    cat_cleaning: "ক্লিনিং",
    cat_maintenance: "মেইনটেন্যান্স",
    cat_repair: "রিপেয়ার",
    cat_tools: "সরঞ্জাম",
    price_from: "শুরু",
    find_service_placeholder: "পছন্দের সার্ভিসটি খুঁজুন...",
    services_title: "সেবাসমূহ",
    product: "প্রোডাক্ট",
    service: "সার্ভিস",
    no_match_found: "কিছু পাওয়া যায়নি",
    view_all_results: "সব রেজাল্ট দেখুন",
    search_suggestions: "সার্চ সাজেশন",
    quantity: "পরিমাণ",
    add_to_cart: "তালিকায় যোগ করুন",
    management_terminal: "ম্যানেজমেন্ট টার্মিনাল",
    server_status: "সার্ভার স্ট্যাটাস",
    online: "অনলাইন",
    live_site: "লাইভ সাইট",
    admin_login_title: "অ্যাকাউন্ট লগইন",
    admin_login_desc: "আপনার তথ্য প্রদান করুন",
    enter_email: "ইমেইল অ্যাড্রেস লিখুন",
    enter_password: "পাসওয়ার্ড লিখুন",
    login_btn: "লগইন করুন / Login",
    registration_btn: "রেজিস্ট্রেশন / Registration",
    back_to_site: "সাইটে ফিরে যান",
    exit_terminal: "টার্মিনাল থেকে বের হোন",
    new_service: "নতুন সার্ভিস",
    new_order: "নতুন অর্ডার",
    new_booking: "নতুন বুকিং",
    new_sku: "নতুন এসকেইউ (SKU)",
    back: "পেছনে"
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_products: "Products",
    nav_account: "Account",
    search_placeholder: "Search products or services...",
    nav_offers: "Offers",
    item_supporthub: "Support Hub",
    footer_about: "About Us",
    footer_services: "Services",
    footer_company: "Company",
    footer_contact: "Contact",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions",
    all_services_title: "All Services",
    empty_cart: "Your cart is empty",
    empty_cart_desc: "You haven't added any items or services yet.",
    browse_catalog: "Browse Catalog",
    cart_added: "Added to Cart",
    cart_desc: "Item has been successfully added to your list.",
    book_now: "Book Now",
    flash_sale: "Flash Sale",
    ends_in: "Ends In",
    sold: "Sold",
    book: "Book",
    order_summary: "Order Summary",
    secure_checkout: "Secure Checkout",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shipping_free: "Free",
    total: "Total",
    proceed_to_checkout: "Proceed to Checkout",
    delivery_info: "Delivery Info",
    full_name: "Enter Your Full Name",
    phone_number: "Enter Your Mobile Number",
    email_address: "Enter Your Email Address",
    delivery_address: "Enter Your Full Address",
    payment_method: "Payment Method",
    processing: "Processing...",
    order_confirmed: "Order Confirmed!",
    thank_you_order: "Thank you for shopping with us.",
    order_id: "Order ID",
    back_to_shop: "Back to Shop",
    login_info: "Login Information",
    temp_password: "Temporary Password",
    account_created: "Account Created",
    otp_sent: "OTP Sent",
    otp_verified: "OTP Verified",
    invalid_otp: "Invalid OTP",
    send_otp: "Send OTP",
    phone_exists_error: "This phone number is already registered.",
    personal_dashboard: "Personal Dashboard",
    portal_access: "Portal Access",
    view_all: "View All",
    cat_all: "All Categories",
    cat_cleaning: "Cleaning",
    cat_maintenance: "Maintenance",
    cat_repair: "Repair",
    cat_tools: "Tools",
    price_from: "From",
    find_service_placeholder: "Search for a service...",
    services_title: "Services",
    product: "Product",
    service: "Service",
    no_match_found: "No Match Found",
    view_all_results: "View All Results",
    search_suggestions: "Search Suggestions",
    quantity: "Quantity",
    add_to_cart: "Add to Cart",
    management_terminal: "Management Terminal",
    server_status: "Server Status",
    online: "Online",
    live_site: "Live Site",
    admin_login_title: "Account Login",
    admin_login_desc: "Please provide your details",
    enter_email: "Enter Your Email Address",
    enter_password: "Enter Your Password",
    login_btn: "Login / লগইন করুন",
    registration_btn: "Registration / রেজিস্ট্রেশন",
    back_to_site: "Back to Site",
    exit_terminal: "Exit Terminal",
    new_service: "New Service",
    new_order: "New Order",
    new_booking: "New Booking",
    new_sku: "New SKU",
    back: "Back"
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
