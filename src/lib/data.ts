
import { Product, Service } from '@/types';
import { PlaceHolderImages } from './placeholder-images';

export const getMockProducts = (language: 'bn' | 'en'): Product[] => [
  {
    id: '1',
    name: language === 'bn' ? 'স্মার্ট ভ্যাকিউম রোবট' : 'Smart Vacuum Robot',
    price: 49999,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'সব ধরনের মেঝের জন্য এআই-চালিত ক্লিনিং।' : 'AI-powered autonomous cleaning for all floor types.',
    description: language === 'bn' 
      ? 'আল্ট্রাক্লিন রোবট আপনার বাড়ি নেভিগেট করতে এবং প্রতিটি কোণ দাগহীন তা নিশ্চিত করতে উন্নত লিডার ম্যাপিং ব্যবহার করে। এটি কার্পেট এবং হার্ড ফ্লোর উভয় ক্ষেত্রেই সমানভাবে কার্যকর।' 
      : 'The UltraClean Robot uses advanced LiDAR mapping to navigate your home and ensure every corner is spotless. It works seamlessly on both carpets and hard floors.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '2',
    name: language === 'bn' ? 'পরিবেশ বান্ধব সলিউশন কিট' : 'Eco-Friendly Solution Kit',
    price: 4500,
    category: language === 'bn' ? 'সরবরাহ' : 'Supplies',
    shortDescription: language === 'bn' ? 'জৈব এবং অ-বিষাক্ত ক্লিনিং এজেন্ট।' : 'Biodegradable non-toxic cleaning agents.',
    description: language === 'bn'
      ? 'পোষা প্রাণী এবং শিশুদের জন্য নিরাপদ, আমাদের জৈব ক্লিনিং কিটে মাল্টি-সারফেস স্প্রে এবং গ্লাস ক্লিনার অন্তর্ভুক্ত রয়েছে। এতে কোনো ক্ষতিকারক রাসায়নিক নেই।'
      : 'Safe for pets and children, our organic cleaning kit includes multi-surface sprays and glass cleaners. No harsh chemicals or toxins included.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '3',
    name: language === 'bn' ? 'প্রফেশনাল স্টিম মপ' : 'Professional Steam Mop',
    price: 12900,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'উচ্চ-তাপমাত্রার বাষ্প ব্যবহার করে মেঝে জীবাণুমুক্ত করুন।' : 'Sanitize floors without chemicals using high-temp steam.',
    description: language === 'bn'
      ? '৯৯.৯% ব্যাকটেরিয়া এবং জীবাণু ধ্বংস করে। হার্ডউড এবং টাইল ফ্লোরের জন্য উপযুক্ত। কোনো কেমিক্যাল ছাড়াই গভীর পরিষ্কার নিশ্চিত করে।'
      : 'Kills 99.9% of bacteria and germs. Perfect for hardwood and tile floors. Ensures deep cleaning without any chemicals.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '4',
    name: language === 'bn' ? 'এয়ার পিউরিফায়ার প্র' : 'Air Purifier Pro',
    price: 29900,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'পরিষ্কার বাতাসের জন্য উন্নত ফিল্টার।' : 'Advanced filtration for pure indoor air.',
    description: language === 'bn'
      ? 'উচ্চ ক্ষমতাসম্পন্ন হেপা ফিল্টার এবং অ্যাক্টিভেটেড কার্বন ফিল্টারের সমন্বয়ে এটি দুর্গন্ধ এবং অ্যালার্জেন দূর করে বাতাসের মান উন্নত করে।'
      : 'High efficiency particulate air (HEPA) filter combined with activated carbon to remove odors and allergens, significantly improving indoor air quality.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-4')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '5',
    name: language === 'bn' ? 'উইন্ডো ক্লিনিং রোবট' : 'Window Cleaning Robot',
    price: 34999,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'অনায়াসে গ্লাস পরিষ্কারের রোবট।' : 'Effortless window cleaning with AI-driven robot.',
    description: language === 'bn'
      ? 'সাকশন-ভিত্তিক উইন্ডো ক্লিনার যা স্বয়ংক্রিয়ভাবে আপনার কাঁচের পৃষ্ঠগুলো ম্যাপ করে এবং দাগহীন ফিনিশ নিশ্চিত করে।'
      : 'Suction-based window cleaner that automatically maps your glass surfaces for a streak-free finish. Ideal for high-rise windows.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-6')?.imageUrl || '',
    type: 'product',
  }
];

export const getMockServices = (language: 'bn' | 'en'): Service[] => [
  {
    id: 's1',
    title: language === 'bn' ? 'হোম ডিপ ক্লিন' : 'Home Deep Clean',
    description: language === 'bn' ? 'প্রফেশনাল টিমের মাধ্যমে আপনার বাসভবনের সম্পূর্ণ পরিচ্ছন্নতা।' : 'Comprehensive top-to-bottom cleaning of your entire residence by professional teams.',
    icon: 'Layout',
    basePrice: 15000,
    displayPrice: language === 'bn' ? '১৫০০০' : '15000',
    imageUrl: PlaceHolderImages.find(img => img.id === 'service-home')?.imageUrl || '',
    type: 'service',
  },
  {
    id: 's2',
    title: language === 'bn' ? 'এসি রক্ষণাবেক্ষণ' : 'AC Maintenance',
    description: language === 'bn' ? 'এসি ইউনিটের দক্ষ সার্ভিসিং এবং স্যানিটাইজেশন।' : 'Expert servicing, cleaning, and sanitization of split and central AC units.',
    icon: 'Wrench',
    basePrice: 5000,
    displayPrice: language === 'bn' ? '৫০০০' : '5000',
    imageUrl: PlaceHolderImages.find(img => img.id === 'service-ac')?.imageUrl || '',
    type: 'service',
  },
  {
    id: 's3',
    title: language === 'bn' ? 'স্যানিটাইজেশন সার্ভিস' : 'Sanitization Service',
    description: language === 'bn' ? 'বাড়ি এবং অফিসের জন্য মেডিকেল-গ্রেড স্যানিটাইজেশন।' : 'Medical-grade fogging and surface sanitization for homes and corporate offices.',
    icon: 'Activity',
    basePrice: 7500,
    displayPrice: language === 'bn' ? '৭৫০০' : '7500',
    imageUrl: PlaceHolderImages.find(img => img.id === 'service-sanitization')?.imageUrl || '',
    type: 'service',
  }
];

export const getProductById = (id: string, language: 'bn' | 'en') => 
  getMockProducts(language).find(p => p.id === id);

export const getServiceById = (id: string, language: 'bn' | 'en') => 
  getMockServices(language).find(s => s.id === id);
