
import { Product, Service, SubService } from '@/types';
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
    status: 'Active'
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
    status: 'Active'
  }
];

/**
 * User provided Service List (Mapped to specific IDs)
 */
export const getMockServices = (language: 'bn' | 'en'): Service[] => [
  {
    id: 'srv_home_clean',
    title: 'Home Cleaning',
    description: 'Complete cleaning of entire home including bedroom, kitchen, and bathroom using professional tools.',
    basePrice: 1500,
    duration: '2-4 hours',
    categoryId: 'Cleaning',
    type: 'service',
    status: 'Active',
    rating: 5.0
  },
  {
    id: 'srv_sofa_carpet',
    title: 'Sofa & Carpet Cleaning',
    description: 'Deep cleaning of sofa and carpets to remove stains, dust, and odor.',
    basePrice: 800,
    duration: '1-2 hours',
    categoryId: 'Cleaning',
    type: 'service',
    status: 'Active',
    rating: 5.0
  },
  {
    id: 'srv_ac_appliance',
    title: 'AC & Appliance Cleaning',
    description: 'Cleaning service for AC, fridge, and appliances to improve performance and hygiene.',
    basePrice: 500,
    duration: '1-3 hours',
    categoryId: 'Cleaning',
    type: 'service',
    status: 'Active',
    rating: 5.0
  },
  {
    id: 'srv_deep_clean',
    title: 'Deep Cleaning',
    description: 'Intensive deep cleaning of full home with sanitization and heavy dirt removal.',
    basePrice: 3000,
    duration: '4-8 hours',
    categoryId: 'Cleaning',
    type: 'service',
    status: 'Active',
    rating: 5.0
  }
];

/**
 * User provided Sub-service List with pre-defined Parent Mapping
 */
export const getMockSubServices = (): Partial<SubService>[] => [
  {
    name: 'Kitchen Cleaning',
    description: 'Deep cleaning of kitchen including stove, cabinet, and sink.',
    price: 500,
    duration: '45-60 minutes',
    status: 'Active',
    mainServiceId: 'srv_home_clean',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  },
  {
    name: 'Bathroom Cleaning',
    description: 'Full bathroom cleaning with sanitization and odor removal.',
    price: 400,
    duration: '30-45 minutes',
    status: 'Active',
    mainServiceId: 'srv_home_clean',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  },
  {
    name: 'Bedroom Cleaning',
    description: 'Cleaning of bedroom including furniture and floor.',
    price: 400,
    duration: '30-45 minutes',
    status: 'Active',
    mainServiceId: 'srv_home_clean',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  },
  {
    name: 'Sofa Cleaning',
    description: 'Professional sofa cleaning using steam and shampoo.',
    price: 600,
    duration: '60 minutes',
    status: 'Active',
    mainServiceId: 'srv_sofa_carpet',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  },
  {
    name: 'Window Cleaning',
    description: 'Glass and window cleaning with polishing.',
    price: 300,
    duration: '30 minutes',
    status: 'Active',
    mainServiceId: 'srv_home_clean',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  },
  {
    name: 'Floor Cleaning',
    description: 'Deep floor cleaning with scrubbing and polishing.',
    price: 700,
    duration: '60-90 minutes',
    status: 'Active',
    mainServiceId: 'srv_home_clean',
    isAddOnEnabled: true,
    isDefaultAddOn: false
  }
];

export const getProductById = (id: string, language: 'bn' | 'en') => 
  getMockProducts(language).find(p => p.id === id);

export const getServiceById = (id: string, language: 'bn' | 'en') => 
  getMockServices(language).find(s => s.id === id);
