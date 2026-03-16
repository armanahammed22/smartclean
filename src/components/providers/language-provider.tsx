
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

    // Hero & Sections
    hero_title: "পরিচ্ছন্ন জীবনের জন্য স্মার্ট সমাধান",
    hero_subtitle: "বাংলাদেশে বিশেষজ্ঞ ক্লিনিং এবং রক্ষণাবেক্ষণ সেবা। হাজার হাজার মানুষের বিশ্বস্ত।",
    hero_cta: "বুক করুন",
    expert_services: "বিশেষজ্ঞ সেবা",
    professional_tools: "প্রফেশনাল টুলস",
    service_desc: "হোম এবং অফিসের জন্য প্রফেশনাল রক্ষণাবেক্ষণ সমাধান।",
    product_desc: "সেরা ক্লিনিং পারফরম্যান্সের জন্য উচ্চ-ক্ষমতাসম্পন্ন সরঞ্জাম।",
    
    // Admin & User Summaries
    mgmt_center: "ম্যানেজমেন্ট কমান্ড সেন্টার",
    ops_overview: "রিয়েল-টাইম অপারেশন ওভারভিউ",
    full_admin: "সম্পূর্ণ অ্যাডমিন খুলুন",
    welcome_back: "স্বাগতম,",
    active_bookings: "আপনার ২ টি বুকিং পেন্ডিং আছে।",
    view_history: "ইতিহাস দেখুন",
    go_dashboard: "ড্যাশবোর্ড",
    leads: "লিডস",
    sales: "সেলস",
    growth: "গ্রোথ",
    active_staff: "সক্রিয় কর্মী",

    // Dashboard Stats
    stat_total_leads: "মোট লিড",
    stat_active_customers: "সক্রিয় কাস্টমার",
    stat_sales_volume: "বিক্রয় পরিমাণ",
    stat_new_inquiries: "নতুন ইনকোয়ারি",
    leads_acquisition: "লিড অর্জন",
    market_insights: "মার্কেট ইনসাইটস",
    campaign_conversions: "ক্যাম্পেইন কনভার্সন",
    capture_rate: "ক্যাপচার রেট",
    view_marketing_report: "মার্কেটিং রিপোর্ট দেখুন",
    seed_erp_data: "ERP ডাটা সিড করুন",
    erp_data_seeded: "ERP ডাটা সিড করা হয়েছে",
    crm_overview: "CRM ওভারভিউ",
    engagement_metrics: "রিয়েল-টাইম এনগেজমেন্ট ম্যাট্রিক্স",

    // Admin Sidebar Groups
    group_main: "মেইন ও অ্যানালিটিক্স",
    group_crm: "CRM ও সেলস",
    group_inventory: "ইনভেন্টরি ও প্রোডাক্ট",
    group_service: "সার্ভিস অপারেশন",
    group_page: "পেজ কম্পোনেন্ট",
    group_growth: "গ্রোথ ও রিওয়ার্ড",
    group_system: "সিস্টেম ও লজিস্টিক",

    // Admin Sidebar Items
    item_dashboard: "ড্যাশবোর্ড",
    item_reports: "রিপোর্ট",
    item_leads: "সেলস লিড",
    item_orders: "প্রোডাক্ট অর্ডার",
    item_bookings: "সার্ভিস বুকিং",
    item_customers: "কাস্টমার ডিরেক্টরি",
    item_tickets: "সাপোর্ট টিকিট",
    item_products: "প্রোডাক্টস",
    item_categories: "ক্যাটাগরি",
    item_brands: "ব্র্যান্ডস",
    item_alerts: "স্টক অ্যালার্ট",
    item_services: "সার্ভিস লিস্ট",
    item_subservices: "সাব-সার্ভিস",
    item_areas: "সার্ভিস এরিয়া",
    item_links: "কুইক লিংক",
    item_actions: "কুইক অ্যাকশন",
    item_customize: "সাইট কাস্টমাইজ",
    item_marketing: "মার্কেটিং ও কুপন",
    item_referrals: "রেফারাল প্রোগ্রাম",
    item_staff: "স্টাফ ডিরেক্টরি",
    item_couriers: "কুরিয়ার",
    item_subscription: "সাবস্কৃপশন",
    item_settings: "গ্লোবাল সেটিিংস",
    item_roles: "অ্যাক্সেস কন্ট্রোল",

    // Products & Cart
    products_title: "সেরা পণ্যসমূহ",
    products_subtitle: "প্রফেশনাল ফলাফলের জন্য উচ্চ-ক্ষমতাসম্পন্ন সরঞ্জাম।",
    view_all: "সব দেখুন",
    add_to_cart: "কার্টে যোগ করুন",
    order_now: "অর্ডার করুন",
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
    price_from: "থেকে শুরু",
    fixed_price: "ফিক্সড",
    base_price: "বেস প্রাইস",
    
    // Checkout & Summary
    order_summary: "অর্ডার সারাংশ",
    subtotal: "উপমোট",
    shipping: "শিপিং",
    shipping_free: "ফ্রি",
    tax: "ট্যাক্স (আনুমানিক)",
    total: "মোট",
    proceed_to_checkout: "চেকআউট করুন",
    checkout_title: "চেকআউট ও বুকিং",
    delivery_info: "বুকিং ও ডেলিভারি তথ্য",
    full_name: "পুরো নাম",
    phone_number: "ফোন নম্বর (আবশ্যক)",
    email_optional: "ইমেল ঠিকানা (ঐচ্ছিক)",
    delivery_address: "সেবার ঠিকানা / ডেলিভারি ঠিকানা",
    booking_date: "পছন্দসই তারিখ",
    booking_time: "পছন্দসই সময়",
    select_service: "সেবা নির্বাচন করুন",
    order_notes: "অর্ডার নোট (ঐচ্ছিক)",
    place_order: "অর্ডার সম্পন্ন করুন",
    processing: "প্রসেসিং হচ্ছে...",
    secure_checkout: "আপনার তথ্য সুরক্ষিত এবং এনক্রিপ্ট করা।",
    pick_date: "তারিখ বেছে নিন",
    select_time: "সময় বেছে নিন",
    morning: "সকাল (৮টা - ১২টা)",
    afternoon: "দুপুর (১২টা - ৪টা)",
    evening: "বিকাল (৪টা - ৮টা)",
    payment_method: "পেমেন্ট পদ্ধতি",
    payment_cod: "ক্যাশ অন ডেলিভারি (COD)",
    payment_cash_hand: "ক্যাশ ইন হ্যান্ড (Cash in Hand)",
    
    // OTP & Guest
    verify_phone: "ফোন নম্বর যাচাই করুন",
    send_otp: "ওটিপি পাঠান",
    enter_otp: "৬-সংখ্যার ওটিপি দিন",
    otp_sent: "আপনার ফোনে ওটিপি পাঠানো হয়েছে",
    otp_verified: "ফোন নম্বর সফলভাবে যাচাই করা হয়েছে",
    invalid_otp: "ভুল ওটিপি, আবার চেষ্টা করুন",
    guest_note: "অর্ডার সম্পন্ন হলে আপনার ফোন নম্বর ব্যবহার করে একটি অ্যাকাউন্ট তৈরি করা হবে।",
    phone_login: "ফোন নম্বর দিয়ে লগইন",
    email_login: "ইমেল দিয়ে লগইন",
    login_required_desc: "এই অ্যাকশনটি সম্পন্ন করতে আপনার ফোন নম্বর দিয়ে লগইন বা রেজিস্ট্রেশন করা আবশ্যক।",
    phone_exists_error: "এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে লগইন করুন।",

    // Order Success
    order_confirmed: "অর্ডার নিশ্চিত করা হয়েছে!",
    thank_you_order: "আপনার ক্রয়ের জন্য ধন্যবাদ। আপনার অর্ডার গ্রহণ করা হয়েছে এবং প্রসেস করা হচ্ছে।",
    order_id: "অর্ডার আইডি",
    confirmation_email: "আপনার ইনবক্সে একটি নিশ্চিতকরণ ইমেল পাঠানো হয়েছে।",
    back_to_shop: "দোকানে ফিরে যান",
    continue_shopping: "কেনাকাটা চালিয়ে যান",
    account_created: "আপনার অ্যাকাউন্ট তৈরি করা হয়েছে!",
    temp_password: "অস্থায়ী পাসওয়ার্ড",
    login_info: "ভবিষ্যতে লগইন করার জন্য এই তথ্যগুলো সংরক্ষণ করুন।",

    // Footer
    footer_desc: "পুরো বাংলাদেশে প্রফেশনাল ক্লিনিং সেবার সবচেয়ে বিশ্বস্ত নাম। ১০০০+ সন্তুষ্ট গ্রাহকের বিশ্বস্ত।",
    footer_services: "সেবা সমূহ",
    footer_company: "কোম্পানি",
    footer_contact: "যোগাযোগ করুন",
    footer_address: "ওয়ারলেস গেট, মহাখালী, ঢাকা-১২১২",
    footer_hours: "শনি - বৃহস্পতি: সকাল ৮টা - রাত ৮টা",
    footer_rights: "© ২০২৬ স্মার্ট ক্লিন বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
    footer_about: "আমাদের সম্পর্কে",
    footer_careers: "ক্যারিয়ার",
    footer_privacy: "প্রাইভেসি পলিসি",
    footer_terms: "শর্তাবলী",
    footer_refund: "রিফান্ড পলিসি",
    
    // UI
    cart_added: "অর্ডারে যোগ করা হয়েছে",
    cart_desc: "আইটেমটি আপনার অর্ডারের তালিকায় যোগ করা হয়েছে।",
    service_billing_note: "দ্রষ্টব্য: পরিষেবার পরিমাণগুলি বেস প্রাইস এবং কাজের প্রয়োজনীয়তার ভিত্তিতে পরিবর্তিত হতে পারে।",
    chat_wa: "হোয়াটসঅ্যাপে চ্যাট করুন",

    // Dynamic Labels
    "PC Builder": "পিসি বিল্ডার",
    "Laptop Finder": "ল্যাপটপ ফাইন্ডার",
    "TV Offer": "টিভি অফার",
    "Camera": "ক্যামেরা",
    "Smartphone": "স্মার্টফোন",
    "Tablet": "ট্যাবলেট",
    "Drone": "ড্রোন",
    "Starlink": "স্টারলিংক"
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

    // Hero & Sections
    hero_title: "Smart Solutions for a Clean Life",
    hero_subtitle: "Expert cleaning and maintenance services in Bangladesh. Trusted by thousands.",
    hero_cta: "Book Now",
    expert_services: "Expert Services",
    professional_tools: "Professional Tools",
    service_desc: "Professional maintenance solutions for home and office.",
    product_desc: "High-performance tools for the best cleaning performance.",

    // Admin & User Summaries
    mgmt_center: "Management Command Center",
    ops_overview: "Real-time Operations Overview",
    full_admin: "Open Full Admin",
    welcome_back: "Welcome back,",
    active_bookings: "You have 2 active bookings pending.",
    view_history: "View History",
    go_dashboard: "Dashboard",
    leads: "Leads",
    sales: "Sales",
    growth: "Growth",
    active_staff: "Active Staff",

    // Dashboard Stats
    stat_total_leads: "Total Leads",
    stat_active_customers: "Active Customers",
    stat_sales_volume: "Sales Volume",
    stat_new_inquiries: "New Inquiries",
    leads_acquisition: "Leads Acquisition",
    market_insights: "Market Insights",
    campaign_conversions: "Campaign Conversions",
    capture_rate: "Capture Rate",
    view_marketing_report: "View Marketing Report",
    seed_erp_data: "Seed ERP Data",
    erp_data_seeded: "ERP Data Seeded",
    crm_overview: "CRM Overview",
    engagement_metrics: "Real-time engagement metrics",

    // Admin Sidebar Groups
    group_main: "Main & Analytics",
    group_crm: "CRM & Sales",
    group_inventory: "Inventory & Products",
    group_service: "Service Operations",
    group_page: "Page Components",
    group_growth: "Growth & Rewards",
    group_system: "System & Logistics",

    // Admin Sidebar Items
    item_dashboard: "Dashboard",
    item_reports: "Reports",
    item_leads: "Sales Leads",
    item_orders: "Product Orders",
    item_bookings: "Service Bookings",
    item_customers: "Customer Directory",
    item_tickets: "Support Tickets",
    item_products: "Products",
    item_categories: "Categories",
    item_brands: "Brands",
    item_alerts: "Stock Alerts",
    item_services: "Service List",
    item_subservices: "Sub-Services",
    item_areas: "Service Areas",
    item_links: "Quick Links",
    item_actions: "Quick Actions",
    item_customize: "Site Customize",
    item_marketing: "Marketing & Coupons",
    item_referrals: "Referral Program",
    item_staff: "Staff Directory",
    item_couriers: "Couriers",
    item_subscription: "Subscription",
    item_settings: "Global Settings",
    item_roles: "Access Control",

    // Products & Cart
    products_title: "Featured Products",
    products_subtitle: "High-performance tools for professional results.",
    view_all: "View All",
    add_to_cart: "Add to Cart",
    order_now: "Order Now",
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
    price_from: "Starts From",
    fixed_price: "Fixed",
    base_price: "Base Price",
    
    // Checkout & Summary
    order_summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shipping_free: "Free",
    tax: "Tax (Estimated)",
    total: "Total",
    proceed_to_checkout: "Proceed to Checkout",
    checkout_title: "Checkout & Booking",
    delivery_info: "Booking & Delivery Information",
    full_name: "Full Name",
    phone_number: "Phone Number (Required)",
    email_optional: "Email Address (Optional)",
    delivery_address: "Service Address / Delivery Address",
    booking_date: "Preferred Date",
    booking_time: "Preferred Time",
    select_service: "Select Service",
    order_notes: "Order Notes (Optional)",
    place_order: "Place Order",
    processing: "Processing...",
    secure_checkout: "Your data is protected and encrypted.",
    pick_date: "Pick a date",
    select_time: "Select time slot",
    morning: "Morning (8AM - 12PM)",
    afternoon: "Afternoon (12PM - 4PM)",
    evening: "Evening (4PM - 8PM)",
    payment_method: "Payment Method",
    payment_cod: "Cash on Delivery (COD)",
    payment_cash_hand: "Cash in Hand",

    // OTP & Guest
    verify_phone: "Verify Phone Number",
    send_otp: "Send OTP",
    enter_otp: "Enter 6-digit OTP",
    otp_sent: "OTP has been sent to your phone",
    otp_verified: "Phone number verified successfully",
    invalid_otp: "Invalid OTP, please try again",
    guest_note: "An account will be created using your phone number upon checkout.",
    phone_login: "Login with Phone",
    email_login: "Login with Email",
    login_required_desc: "You must login or register with your phone number to complete this action.",
    phone_exists_error: "This phone number is already registered. Please login.",

    // Order Success
    order_confirmed: "Order Confirmed!",
    thank_you_order: "Thank you for your purchase. Your order has been received and is being processed.",
    order_id: "Order ID",
    confirmation_email: "A confirmation email has been sent to your inbox.",
    back_to_shop: "Back to Shop",
    continue_shopping: "Continue Shopping",
    account_created: "Your account has been created!",
    temp_password: "Temporary Password",
    login_info: "Save these details for future logins.",

    // Footer
    footer_desc: "The most trusted name for professional cleaning services across Bangladesh. Trusted by 1000+ satisfied clients.",
    footer_services: "Services",
    footer_company: "Company",
    footer_contact: "Contact Us",
    footer_address: "Wireless Gate, Mohakhali, Dhaka-1212",
    footer_hours: "Sat - Thu: 8am - 8pm",
    footer_rights: "© 2026 Smart Clean Bangladesh. All rights reserved.",
    footer_about: "About Us",
    footer_careers: "Careers",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_refund: "Refund Policy",
    
    // UI
    cart_added: "Added to Order",
    cart_desc: "Item has been added to your order list.",
    service_billing_note: "Note: Service amounts are base prices and may vary based on actual work requirements.",
    chat_wa: "Chat via WhatsApp",

    // Dynamic Labels
    "PC Builder": "PC Builder",
    "Laptop Finder": "Laptop Finder",
    "TV Offer": "TV Offer",
    "Camera": "Camera",
    "Smartphone": "Smartphone",
    "Tablet": "Tablet",
    "Drone": "Drone",
    "Starlink": "Starlink"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Bangla ('bn')
  const [language, setLanguageState] = useState<Language>('bn');

  // Load language from localStorage on mount
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
