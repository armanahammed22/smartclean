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
    nav_booking: "বুকিং",
    search_placeholder: "সার্ভিস খুঁজুন...",
    
    // Hero
    hero_title: "পরিচ্ছন্ন জীবনের জন্য স্মার্ট সমাধান",
    hero_subtitle: "বাংলাদেশে বিশেষজ্ঞ ক্লিনিং এবং রক্ষণাবেক্ষণ সেবা। হাজার হাজার মানুষের বিশ্বস্ত।",
    hero_cta: "এখনই বুক করুন",
    
    // Products
    products_title: "শীর্ষ ক্লিনিং পণ্য",
    products_subtitle: "প্রফেশনাল ফলাফলের জন্য উচ্চ-ক্ষমতাসম্পন্ন সরঞ্জাম।",
    view_all: "সব দেখুন",
    add_to_cart: "কার্টে যোগ করুন",
    
    // Services
    services_title: "আমাদের বিশেষজ্ঞতা",
    services_subtitle: "আমরা বিশেষায়িত ক্লিনিং এবং রক্ষণাবেক্ষণ সেবার একটি বিস্তৃত পরিসর প্রদান করি।",
    service_details: "বিস্তারিত",
    price_from: "থেকে",
    
    // Features
    features_title: "স্মার্ট ক্লিনের সুবিধা",
    features_subtitle: "কেন আমরা ১০০০+ গ্রাহকের পছন্দের তালিকায়।",
    
    // Footer
    footer_desc: "পুরো বাংলাদেশে প্রফেশনাল ক্লিনিং সেবার সবচেয়ে বিশ্বস্ত নাম। ১০০০+ সন্তুষ্ট গ্রাহকের বিশ্বস্ত।",
    footer_services: "সেবা সমূহ",
    footer_company: "কোম্পানি",
    footer_contact: "যোগাযোগ করুন",
    footer_address: "ওয়ারলেস গেট, মহাখালী, ঢাকা-১২১২",
    footer_hours: "শনি - বৃহস্পতি: সকাল ৮টা - রাত ৮টা",
    footer_rights: "© ২০২৬ স্মার্ট ক্লিন বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
    
    // UI
    cart_added: "কার্টে যোগ করা হয়েছে",
    cart_desc: "আপনার শপিং কার্টে পণ্যটি যোগ করা হয়েছে।"
  },
  en: {
    // Navbar
    nav_home: "Home",
    nav_services: "Services",
    nav_products: "Products",
    nav_account: "Account",
    nav_customize: "Customize service",
    nav_booking: "Booking",
    search_placeholder: "Search services...",
    
    // Hero
    hero_title: "Smart Solutions for a Clean Life",
    hero_subtitle: "Expert cleaning and maintenance services in Bangladesh. Trusted by thousands.",
    hero_cta: "Book Now",
    
    // Products
    products_title: "Top Cleaning Products",
    products_subtitle: "High-performance tools for professional results.",
    view_all: "View All",
    add_to_cart: "Add to Cart",
    
    // Services
    services_title: "Our Expertise",
    services_subtitle: "We provide a wide range of specialized cleaning and maintenance services.",
    service_details: "Details",
    price_from: "From",
    
    // Features
    features_title: "The Smart Clean Advantage",
    features_subtitle: "Why we are the preferred choice for 1000+ clients.",
    
    // Footer
    footer_desc: "The most trusted name for professional cleaning services across Bangladesh. Trusted by 1000+ satisfied clients.",
    footer_services: "Services",
    footer_company: "Company",
    footer_contact: "Contact Us",
    footer_address: "Wireless Gate, Mohakhali, Dhaka-1212",
    footer_hours: "Sat - Thu: 8am - 8pm",
    footer_rights: "© 2026 Smart Clean Bangladesh. All rights reserved.",
    
    // UI
    cart_added: "Added to cart",
    cart_desc: "Item has been added to your shopping cart."
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
