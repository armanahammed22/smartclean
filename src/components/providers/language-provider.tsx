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
    nav_services: "সেবা সমূহ",
    nav_products: "পণ্য",
    nav_account: "অ্যাকাউন্ট",
    search_placeholder: "পণ্য বা সার্ভিস খুঁজুন...",
    nav_offers: "অফারসমূহ",
    item_supporthub: "সাপোর্ট হাব",
    footer_about: "আমাদের সম্পর্কে",
    footer_services: "সার্ভিস সমূহ",
    footer_company: "কোম্পানি",
    footer_contact: "যোগাযোগ",
    footer_privacy: "প্রাইভেসি পলিসি",
    footer_terms: "শর্তাবলী",
    all_services_title: "সব সেবা",
    empty_cart: "আপনার তালিকা খালি",
    cart_added: "অর্ডারে যোগ করা হয়েছে",
    cart_desc: "আইটেমটি আপনার অর্ডারের তালিকায় যোগ করা হয়েছে।",
    book_now: "বুক করুন",
    flash_sale: "ফ্ল্যাশ সেল",
    ends_in: "শেষ হতে বাকি",
    sold: "বিক্রি",
    book: "বুকিং",
    order_summary: "অর্ডার সারাংশ",
    secure_checkout: "সুরক্ষিত চেকআউট"
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_products: "Products",
    nav_account: "Account",
    search_placeholder: "Search products, services...",
    nav_offers: "Offers",
    item_supporthub: "Support Hub",
    footer_about: "About Us",
    footer_services: "Services",
    footer_company: "Company",
    footer_contact: "Contact",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions",
    all_services_title: "All Services",
    empty_cart: "Your list is empty",
    cart_added: "Added to Order",
    cart_desc: "Item has been added to your order list.",
    book_now: "Book Now",
    flash_sale: "Flash Sale",
    ends_in: "Ends In",
    sold: "Sold",
    book: "Book",
    order_summary: "Order Summary",
    secure_checkout: "Secure Checkout"
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
