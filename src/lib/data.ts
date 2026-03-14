import { Product, Service } from '@/types';
import { PlaceHolderImages } from './placeholder-images';

export const getMockProducts = (language: 'bn' | 'en'): Product[] => [
  {
    id: '1',
    name: language === 'bn' ? 'স্মার্ট ভ্যাকিউম রোবট' : 'Smart Vacuum Robot',
    price: 49999,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'সব ধরনের মেঝের জন্য এআই-চালিত ক্লিনিং।' : 'AI-powered autonomous cleaning for all floor types.',
    description: 'The UltraClean Robot uses advanced LiDAR mapping to navigate your home and ensure every corner is spotless.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '2',
    name: language === 'bn' ? 'পরিবেশ বান্ধব সলিউশন কিট' : 'Eco-Friendly Solution Kit',
    price: 4500,
    category: language === 'bn' ? 'সরবরাহ' : 'Supplies',
    shortDescription: language === 'bn' ? 'জৈব এবং অ-বিষাক্ত ক্লিনিং এজেন্ট।' : 'Biodegradable non-toxic cleaning agents.',
    description: 'Safe for pets and children, our organic cleaning kit includes multi-surface sprays and glass cleaners.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '3',
    name: language === 'bn' ? 'প্রফেশনাল স্টিম মপ' : 'Professional Steam Mop',
    price: 12900,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'উচ্চ-তাপমাত্রার বাষ্প ব্যবহার করে মেঝে জীবাণুমুক্ত করুন।' : 'Sanitize floors without chemicals using high-temp steam.',
    description: 'Kills 99.9% of bacteria and germs. Perfect for hardwood and tile floors.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '4',
    name: language === 'bn' ? 'এয়ার পিউরিফায়ার প্র' : 'Air Purifier Pro',
    price: 29900,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'পরিষ্কার বাতাসের জন্য উন্নত ফিল্টার।' : 'Advanced filtration for pure indoor air.',
    description: 'High efficiency particulate air filter combined with activated carbon to remove odors and allergens.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-4')?.imageUrl || '',
    type: 'product',
  },
  {
    id: '5',
    name: language === 'bn' ? 'উইন্ডো ক্লিনিং রোবট' : 'Window Cleaning Robot',
    price: 34999,
    category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
    shortDescription: language === 'bn' ? 'অনায়াসে গ্লাস পরিষ্কারের রোবট।' : 'Effortless window cleaning with AI-driven robot.',
    description: 'Suction-based window cleaner that automatically maps your glass surfaces for a streak-free finish.',
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
    type: 'service',
  },
  {
    id: 's2',
    title: language === 'bn' ? 'এসি রক্ষণাবেক্ষণ' : 'AC Maintenance',
    description: language === 'bn' ? 'এসি ইউনিটের দক্ষ সার্ভিসিং এবং স্যানিটাইজেশন।' : 'Expert servicing, cleaning, and sanitization of split and central AC units.',
    icon: 'Wrench',
    basePrice: 5000,
    displayPrice: language === 'bn' ? '৫০০০' : '5000',
    type: 'service',
  },
  {
    id: 's3',
    title: language === 'bn' ? 'স্যানিটাইজেশন সার্ভিস' : 'Sanitization Service',
    description: language === 'bn' ? 'বাড়ি এবং অফিসের জন্য মেডিকেল-গ্রেড স্যানিটাইজেশন।' : 'Medical-grade fogging and surface sanitization for homes and corporate offices.',
    icon: 'Activity',
    basePrice: 7500,
    displayPrice: language === 'bn' ? '৭৫০০' : '7500',
    type: 'service',
  }
];
