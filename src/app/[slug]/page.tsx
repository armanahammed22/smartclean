'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc, orderBy } from 'firebase/firestore';
import { 
  CheckCircle2, 
  Phone, 
  ShoppingCart, 
  Package, 
  MapPin, 
  User, 
  Loader2,
  Zap,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Check,
  Wrench,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

export default function UnifiedLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [selectedAddOnIndices, setSelectedAddOnIndices] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page Config
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Linked Product Data (Only if type is product)
  const productRef = useMemoFirebase(() => (db && page?.productId && page?.type === 'product') ? doc(db, 'products', page.productId) : null, [db, page?.productId, page?.type]);
  const { data: linkedProduct, isLoading: productLoading } = useDoc(productRef);

  // 3. Dynamic Catalog Query (Fetch from main products/services)
  const catalogQuery = useMemoFirebase(() => {
    if (!db || !page?.showCatalogGrid || !page?.catalogSource) return null;
    return query(
      collection(db, page.catalogSource), 
      where('status', '==', 'Active'),
      limit(page.catalogLimit || 8)
    );
  }, [db, page?.showCatalogGrid, page?.catalogSource, page?.catalogLimit]);
  const { data: catalogItems, isLoading: catalogLoading } = useCollection(catalogQuery);

  useEffect(() => {
    if (!isLoading && mounted && (!page || !page.active)) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  if (!mounted || isLoading || (page?.type === 'product' && productLoading)) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page) return null;

  const isService = page.type === 'service';
  const packages = page.packages || [];
  const selectedPackage = packages[selectedPkgIndex];
  const addOns = page.addOns || [];

  const basePrice = selectedPackage?.price || page.price || linkedProduct?.price || 0;
  const addOnsTotal = selectedAddOnIndices.reduce((sum, idx) => sum + (addOns[idx]?.price || 0), 0);
  
  const unitPrice = basePrice + addOnsTotal;
  const regularPrice = selectedPackage?.originalPrice || basePrice;
  const deliveryCharge = isService ? 0 : 60;
  const subTotal = unitPrice * quantity;
  const totalPrice = subTotal + deliveryCharge;

  const toggleAddOn = (idx: number) => {
    setSelectedAddOnIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "আপনার নাম, ফোন এবং ঠিকানা দিন।" });
      return;
    }

    setIsSubmitting(true);
    try {
      const collectionName = isService ? 'bookings' : 'orders';
      
      const orderItems = [
        {
          id: page.productId || page.id,
          name: page.title + (selectedPackage ? ` (${selectedPackage.name})` : ''),
          price: basePrice,
          quantity: quantity
        },
        ...selectedAddOnIndices.map(idx => ({
          id: `addon-${idx}`,
          name: `Add-on: ${addOns[idx].name}`,
          price: addOns[idx].price,
          quantity: quantity
        }))
      ];

      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        status: 'New',
        source: page.slug,
        type: page.type,
        productId: page.productId || null,
        items: orderItems,
        totalPrice: totalPrice,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, collectionName), orderData);
      
      if (page.productId && !isService) {
        await updateDoc(doc(db, 'products', page.productId), {
          stockQuantity: increment(-quantity)
        });
      }

      trackEvent(isService ? 'Lead' : 'Purchase', { value: totalPrice, currency: 'BDT', content_name: page.title });
      setIsSuccess(true);
      
      const intent = isService ? 'সার্ভিস বুক' : 'অর্ডার';
      const selectedAddonNames = selectedAddOnIndices.map(idx => addOns[idx].name).join(', ');
      
      let waMsg = `আসসালামু আলাইকুম, আমি ${orderData.items[0].name} ${intent} করতে চাই।\n`;
      if (selectedAddonNames) waMsg += `অ্যাড-অন: ${selectedAddonNames}\n`;
      waMsg += `\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nপরিমাণ: ${quantity}\nটোটাল: ৳${totalPrice}`;
      
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      setTimeout(() => router.push('/order-success?id=success'), 2000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "অর্ডার সম্পন্ন করা যায়নি।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = {
    bg: isService ? "bg-[#F8FAFC]" : "bg-white",
    accent: isService ? "bg-[#1E5F7A]" : "bg-[#8B0000]",
    accentHover: isService ? "hover:bg-[#154a5e]" : "hover:bg-[#5D0000]",
    cta: isService ? "bg-[#22C55E]" : "bg-[#FFD700]",
    ctaText: isService ? "text-white" : "text-black",
    secondary: isService ? "text-[#1E5F7A]" : "text-[#8B0000]",
    border: isService ? "border-[#1E5F7A]/10" : "border-red-100"
  };

  const scrollToForm = () => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className={cn("min-h-screen font-body text-[#333]", theme.bg)}>
      
      {/* 1. DYNAMIC HERO SECTION */}
      <section className={cn("pt-12 pb-16 px-4 text-center relative overflow-hidden", isService ? "bg-gradient-to-b from-[#1E5F7A] to-[#0D2C3E]" : "bg-gradient-to-b from-[#8B0000] to-[#5D0000]")}>
        <div className="container mx-auto max-w-5xl space-y-8 relative z-10">
          <div className="space-y-4">
            {page.heroBadge && <Badge className={cn("border-none px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl", theme.cta, theme.ctaText)}>{page.heroBadge}</Badge>}
            <h1 className={cn("text-3xl md:text-6xl font-black uppercase tracking-tight leading-tight drop-shadow-2xl", isService ? "text-white" : "text-[#FFD700]")}>
              {page.heroTitle || page.title}
            </h1>
            <p className="text-white text-sm md:text-xl font-bold opacity-90 max-w-2xl mx-auto leading-relaxed">
              {page.heroSubtitle || page.subtitle || page.offer}
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl aspect-[21/9] md:aspect-[21/7] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 group">
            <Image 
              src={page.heroBanner || linkedProduct?.imageUrl || page.imageUrl || 'https://picsum.photos/seed/poster/1200/600'} 
              alt={page.title} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700" 
              priority 
              unoptimized 
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <Button 
              onClick={scrollToForm} 
              className={cn("h-16 px-12 rounded-2xl font-black text-xl uppercase shadow-2xl w-full max-w-sm gap-3 animate-pulse transition-all active:scale-95", theme.cta, theme.ctaText)}
            >
              <ShoppingCart size={24} /> {page.heroCTA || (isService ? 'সার্ভিস বুক করতে চাই' : 'অর্ডার করতে চাই')}
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-12 px-8 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-white/20 font-bold gap-3 w-full max-w-xs" asChild>
                <a href={`tel:${page.phone}`}><Phone size={18} className="text-primary" /> {page.phone}</a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden">
          <Zap size={400} className="absolute -top-40 -left-40 text-white" strokeWidth={1} />
          <Sparkles size={300} className="absolute -bottom-20 -right-20 text-white" strokeWidth={1} />
        </div>
      </section>

      {/* 2. DYNAMIC CATALOG GRID SECTION */}
      {page.showCatalogGrid && (
        <section className="py-20 bg-white border-b">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12 space-y-3">
              <h2 className={cn("text-2xl md:text-4xl font-black uppercase tracking-tight", theme.secondary)}>
                {page.catalogTitle || (page.catalogSource === 'products' ? 'আমাদের বিশেষ পণ্যসমূহ' : 'আমাদের বিশেষ সেবাসমূহ')}
              </h2>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
            </div>

            {catalogLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-50 rounded-[2rem] animate-pulse border" />
                ))}
              </div>
            ) : catalogItems && catalogItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {catalogItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={item.type === 'service' ? `/service/${item.id}` : `/product/${item.id}`}
                    className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image 
                        src={item.imageUrl || 'https://picsum.photos/seed/catalog/400/400'} 
                        alt={item.title || item.name} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-primary border-none shadow-md font-black text-[8px] px-2 py-0.5 rounded-full uppercase">
                          {item.categoryId || 'General'}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 gap-2">
                      <div className="space-y-1">
                        <h3 className="font-black text-gray-900 uppercase text-[11px] md:text-xs leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                          {item.title || item.name}
                        </h3>
                        <p className="text-[10px] text-gray-400 line-clamp-1 font-medium">{item.shortDescription || 'Professional quality assurance.'}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-sm md:text-lg font-black text-primary tracking-tighter">৳{(item.basePrice || item.price)?.toLocaleString()}</span>
                        <div className="p-1.5 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight size={16} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed rounded-[3rem] bg-gray-50/50 text-muted-foreground italic">
                No items available in this category yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. INGREDIENTS / SERVICES GRID (Static Fallback or Additional Info) */}
      {page.ingredients && page.ingredients.length > 0 && (
        <section className="py-16 bg-gray-50/50 px-4 border-b">
          <div className="container mx-auto max-w-5xl">
            <h2 className={cn("text-xl font-black text-center mb-12 uppercase tracking-widest", theme.secondary)}>
              {isService ? 'কেন আমাদের সার্ভিসটি বেছে নেবেন?' : 'যে সকল উপাদানে তৈরি?'}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {page.ingredients.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 bg-white border-2 border-gray-100 rounded-3xl p-1 shadow-lg overflow-hidden group-hover:border-primary group-hover:scale-110 transition-all duration-500">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-gray-600 text-center uppercase tracking-tighter">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. USAGE / DETAILS SECTION */}
      {page.usagePoints && page.usagePoints.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className={cn("text-white p-5 rounded-[2rem] text-center mb-16 shadow-2xl max-w-xl mx-auto", theme.accent)}>
              <h2 className="font-black text-lg md:text-2xl uppercase tracking-tight">{page.usageTitle || (isService ? 'কিভাবে কাজ করি?' : 'ব্যাবহারের নিয়ম')}</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                {page.usagePoints.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className={cn("p-2 rounded-xl mt-0.5 shadow-sm", isService ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600")}><Check size={20} strokeWidth={4} /></div>
                    <p className="text-sm md:text-lg font-bold text-gray-700 leading-relaxed uppercase tracking-tight">{item}</p>
                  </div>
                ))}
              </div>
              <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-[12px] border-white shadow-[0_30px_60px_rgba(0,0,0,0.1)]">
                <Image src={page.usageImage || page.imageUrl} alt="Details" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. TRUST SECTION */}
      {page.trustPoints && page.trustPoints.length > 0 && (
        <section className="py-20 px-4 bg-gray-50/80">
          <div className={cn("container mx-auto max-w-3xl bg-white p-12 rounded-[4rem] border shadow-2xl", theme.border)}>
            <div className={cn("text-white p-5 rounded-2xl text-center mb-12 shadow-xl", theme.accent)}>
              <h2 className="font-black text-lg md:text-2xl uppercase tracking-tight">{page.trustTitle || 'আস্থার কারণ'}</h2>
            </div>
            <div className="space-y-6">
              {page.trustPoints.map((p: string, i: number) => (
                <div key={i} className="flex items-start gap-5 border-b border-gray-100 pb-6 last:border-0 group">
                  <div className={cn("p-1.5 rounded-full transition-colors group-hover:scale-110", theme.secondary)}>
                    <CheckCircle2 size={28} strokeWidth={2.5} />
                  </div>
                  <p className="text-base md:text-xl font-bold text-gray-700 leading-snug uppercase tracking-tight">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. STORAGE INFO (Only for Products) */}
      {!isService && page.storageText && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl border-4 border-dashed border-green-600 p-10 rounded-[3.5rem] bg-green-50/30 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10 text-green-600"><Sparkles size={150}/></div>
            <h2 className="font-black text-red-700 text-2xl uppercase mb-6 underline decoration-green-600 decoration-4 underline-offset-8">যেভাবে সংরক্ষণ করবেনঃ</h2>
            <p className="text-base md:text-lg font-bold text-gray-700 leading-loose italic">
              {page.storageText}
            </p>
          </div>
        </section>
      )}

      {/* 7. PRICING & ADD-ONS SECTION */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-12">
          {/* Packages */}
          {packages.length > 0 && (
            <div className={cn("p-12 rounded-[4rem] text-white text-center shadow-[0_40px_100px_rgba(0,0,0,0.2)] space-y-10", isService ? "bg-gradient-to-r from-[#1E5F7A] to-[#2563EB]" : "bg-gradient-to-r from-[#8B0000] to-[#B22222]")}>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">সেরা অফার প্যাকেজ</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Select your preferred option</p>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {packages.map((pkg: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedPkgIndex(i)}
                    className={cn(
                      "p-8 rounded-3xl border-4 transition-all duration-500 cursor-pointer flex justify-between items-center group",
                      selectedPkgIndex === i ? "bg-white/20 border-white scale-[1.03] shadow-2xl" : "bg-black/10 border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="text-left space-y-1">
                      <p className="text-lg md:text-3xl font-black uppercase tracking-tight">{pkg.name}</p>
                      {pkg.originalPrice > pkg.price && <Badge className="bg-yellow-400 text-black font-black text-[8px] px-2 py-0">BEST VALUE</Badge>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl md:text-4xl font-black">৳{pkg.price}</p>
                      {pkg.originalPrice > pkg.price && <p className="text-[10px] md:text-xs font-bold line-through opacity-50">৳{pkg.originalPrice}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons (Service Specific) */}
          {isService && addOns.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Plus size={20} strokeWidth={3} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight text-[#081621]">অ্যাড-অন সার্ভিস যোগ করুন (ঐচ্ছিক)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addOns.map((add: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => toggleAddOn(i)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                      selectedAddOnIndices.includes(i) ? "border-blue-600 bg-blue-50 shadow-md" : "border-gray-100 bg-white hover:border-blue-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedAddOnIndices.includes(i) ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200"
                      )}>
                        {selectedAddOnIndices.includes(i) && <Check size={14} strokeWidth={4} />}
                      </div>
                      <span className="font-bold text-gray-700 uppercase tracking-tight">{add.name}</span>
                    </div>
                    <span className="font-black text-blue-600">+৳{add.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. ORDER FORM SECTION */}
      <section id="order-form" className="py-32 px-4 container mx-auto max-w-7xl">
        <div className={cn("text-white p-6 rounded-t-[3.5rem] text-center max-w-2xl mx-auto shadow-2xl relative z-10", theme.accent)}>
          <h2 className="font-black text-lg md:text-2xl uppercase tracking-widest">{isService ? 'বুকিং করতে নিচের ফর্মটি পূরণ করুন' : 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন'}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start -mt-4 relative z-0">
          <div className={cn("lg:col-span-7 bg-white p-10 md:p-16 rounded-b-[4rem] rounded-tl-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-t-[12px]", isService ? "border-[#1E5F7A]" : "border-[#8B0000]")}>
            <form onSubmit={handleOrderSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">আপনার নাম (Full Name)</Label>
                  <div className="relative">
                    <User className={cn("absolute left-5 top-1/2 -translate-y-1/2", theme.secondary)} size={24} />
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="নাম লিখুন" 
                      className="h-16 pl-16 bg-gray-50 border-none rounded-2xl font-bold text-xl focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-primary/10" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">ফোন নম্বর (Phone Number)</Label>
                  <div className="relative">
                    <Phone className={cn("absolute left-5 top-1/2 -translate-y-1/2", theme.secondary)} size={24} />
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="০১XXXXXXXXX" 
                      className="h-16 pl-16 bg-gray-50 border-none rounded-2xl font-bold text-xl focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-primary/10" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">{isService ? 'সেবার ঠিকানা (Service Address)' : 'পূর্ণ ঠিকানা (Full Address)'}</Label>
                <div className="relative">
                  <MapPin className={cn("absolute left-5 top-6", theme.secondary)} size={24} />
                  <Textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder={isService ? "আপনার বিস্তারিত ঠিকানা দিন যেখানে সার্ভিস প্রয়োজন" : "বাসা নং, রোড নং, এলাকা এবং জেলা লিখুন"} 
                    className="min-h-[180px] pl-16 pt-6 bg-gray-50 border-none rounded-3xl font-bold text-xl focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-primary/10" 
                    required 
                  />
                </div>
              </div>

              {isSuccess ? (
                <div className="p-12 bg-green-50 rounded-[3.5rem] text-center border-4 border-green-100 animate-in zoom-in-95 duration-500">
                  <CheckCircle2 className="text-green-600 mx-auto mb-6" size={80} strokeWidth={3} />
                  <h3 className="font-black text-green-800 text-3xl uppercase tracking-tighter">{isService ? 'বুকিং সফল হয়েছে!' : 'অর্ডার সফল হয়েছে!'}</h3>
                  <p className="text-green-700 font-bold mt-3 text-lg">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className={cn("w-full h-24 rounded-3xl text-white font-black text-3xl uppercase shadow-2xl transform active:scale-95 transition-all duration-300 gap-4", theme.accent, theme.accentHover)}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-12 w-12" /> : (
                    <>
                      {isService ? "বুকিং সম্পন্ন করুন" : "অর্ডার সম্পন্ন করুন"} 
                      <ArrowRight size={32} strokeWidth={3} />
                    </>
                  )}
                </Button>
              )}
            </form>
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <Card className={cn("rounded-[4rem] border-none shadow-2xl overflow-hidden bg-white border-t-[20px]", isService ? "border-[#1E5F7A]" : "border-[#8B0000]")}>
              <CardContent className="p-12 space-y-10">
                <div className="flex items-center gap-8 border-b border-gray-100 pb-10">
                  <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-gray-50 bg-gray-50 shrink-0 shadow-lg group">
                    <Image src={linkedProduct?.imageUrl || page.imageUrl} alt={page.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h4 className="font-black text-gray-900 uppercase text-sm md:text-lg leading-tight tracking-tight">
                      {page.title} {selectedPackage && <span className={cn("block text-xs mt-1", theme.secondary)}>({selectedPackage.name})</span>}
                    </h4>
                    <div className="flex items-center gap-5">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm"><Minus size={18} strokeWidth={3}/></button>
                      <span className="font-black text-3xl text-primary">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm"><Plus size={18} strokeWidth={3}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between text-[13px] font-black uppercase text-gray-400 tracking-[0.2em]">
                    <span>{isService ? 'সার্ভিস প্রাইজ' : 'প্রোডাক্ট প্রাইজ'}</span>
                    <span className="text-gray-900 font-black">৳{basePrice}</span>
                  </div>
                  
                  {isService && selectedAddOnIndices.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">সিলেক্টেড অ্যাড-অনস</p>
                      {selectedAddOnIndices.map(idx => (
                        <div key={idx} className="flex justify-between text-[12px] font-bold text-gray-600 uppercase">
                          <span>+ {addOns[idx].name}</span>
                          <span>৳{addOns[idx].price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isService && (
                    <div className="flex justify-between text-[13px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="text-blue-600 font-black">৳{deliveryCharge}</span>
                    </div>
                  )}
                  {regularPrice > basePrice && (
                    <div className="flex justify-between text-[13px] font-black uppercase text-green-600 tracking-[0.2em]">
                      <span>আপনার সাশ্রয় (Save)</span>
                      <span className="font-black">-৳{(regularPrice - basePrice) * quantity}</span>
                    </div>
                  )}
                  <div className="pt-10 border-t-4 border-dashed border-gray-50 flex justify-between items-end">
                    <div>
                      <p className={cn("text-xs font-black uppercase tracking-[0.3em] mb-3", theme.secondary)}>সর্বমোট টাকা</p>
                      <p className="text-6xl font-black text-gray-900 tracking-tighter">৳{totalPrice}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] px-5 py-2 rounded-full shadow-sm">CASH ON DELIVERY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center gap-5">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl"><ShieldCheck size={32} /></div>
              <div className="space-y-1">
                <p className="font-black text-sm uppercase tracking-tight text-gray-900">নিরাপদ অর্ডার সিস্টেম</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End-to-End Secure Transaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-5 md:hidden shadow-[0_-20px-60px_rgba(0,0,0,0.2)] flex gap-4 animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex flex-col justify-center pl-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">মোট টাকা</p>
          <p className={cn("text-3xl font-black tracking-tighter leading-none", theme.secondary)}>৳{totalPrice}</p>
        </div>
        <Button onClick={scrollToForm} className={cn("h-16 flex-1 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl gap-2", theme.cta, theme.ctaText)}>
          {isService ? 'বুকিং করুন' : 'অর্ডার করুন'} <ArrowRight size={20} strokeWidth={3} />
        </Button>
      </div>

    </div>
  );
}