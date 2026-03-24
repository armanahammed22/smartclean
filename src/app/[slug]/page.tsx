
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  Phone, 
  ShoppingCart, 
  Package, 
  MapPin, 
  User, 
  Loader2,
  ShieldCheck,
  Zap,
  Star,
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  XCircle,
  Check,
  Wrench,
  Clock,
  Users,
  Calendar,
  Layers,
  Heart
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

  useEffect(() => {
    if (!isLoading && mounted && (!page || !page.active)) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  // Global Logic
  const pageType = page?.type || 'product';
  const isService = pageType === 'service';
  
  const packages = page?.packages || [];
  const selectedPackage = packages[selectedPkgIndex];

  const price = selectedPackage?.price || page?.price || linkedProduct?.price || 0;
  const regularPrice = selectedPackage?.originalPrice || page?.price || linkedProduct?.regularPrice || linkedProduct?.price || 0;
  const deliveryCharge = isService ? 0 : 60;
  const subTotal = price * quantity;
  const totalPrice = subTotal + deliveryCharge;

  const currentStock = linkedProduct?.stockQuantity || 0;
  const isOutOfStock = !isService && linkedProduct && currentStock <= 0;

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
      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        status: 'New',
        source: page.slug,
        type: pageType,
        productId: page.productId || null,
        items: [{
          id: page.productId || page.id,
          name: page.title + (selectedPackage ? ` (${selectedPackage.name})` : ''),
          price: price,
          quantity: quantity
        }],
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
      const waMsg = `আসসালামু আলাইকুম, আমি ${orderData.items[0].name} ${intent} করতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nপরিমাণ: ${quantity}\nটোটাল: ৳${totalPrice}`;
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      setTimeout(() => router.push('/order-success?id=success'), 2000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "অর্ডার সম্পন্ন করা যায়নি।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });

  if (!mounted || isLoading || (page?.type === 'product' && productLoading)) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page) return null;

  /**
   * THEME COLORS BASED ON TYPE
   */
  const theme = {
    bg: isService ? "bg-[#F8FAFC]" : "bg-white",
    accent: isService ? "bg-[#1E5F7A]" : "bg-[#8B0000]", // Deep blue vs Deep Red
    accentHover: isService ? "hover:bg-[#154a5e]" : "hover:bg-[#5D0000]",
    cta: isService ? "bg-[#22C55E]" : "bg-[#FFD700]", // Green vs Yellow
    ctaText: isService ? "text-white" : "text-black",
    secondary: isService ? "text-[#1E5F7A]" : "text-[#8B0000]",
    border: isService ? "border-[#1E5F7A]/10" : "border-red-100"
  };

  return (
    <div className={cn("min-h-screen font-body text-[#333]", theme.bg)}>
      
      {/* 1. HERO SECTION */}
      <section className={cn("pt-8 pb-12 px-4 text-center relative overflow-hidden", isService ? "bg-gradient-to-b from-[#1E5F7A] to-[#0D2C3E]" : "bg-gradient-to-b from-[#8B0000] to-[#5D0000]")}>
        <div className="container mx-auto max-w-4xl space-y-6 relative z-10">
          {page.heroBadge && <Badge className={cn("border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4", theme.cta, theme.ctaText)}>{page.heroBadge}</Badge>}
          <h1 className={cn("text-2xl md:text-5xl font-black uppercase tracking-tight leading-tight", isService ? "text-white" : "text-[#FFD700]")}>
            {page.heroTitle || page.title}
          </h1>
          <p className="text-white text-xs md:text-lg font-bold opacity-90">
            {page.heroSubtitle || page.subtitle || page.offer}
          </p>

          <div className="relative mx-auto max-w-md aspect-square bg-white border-4 border-white/10 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-white">
              <Image 
                src={linkedProduct?.imageUrl || page.imageUrl || 'https://picsum.photos/seed/product/600/600'} 
                alt={page.title} 
                fill 
                className="object-contain p-4" 
                priority 
                unoptimized 
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <Button 
              onClick={scrollToForm} 
              className={cn("h-14 px-10 rounded-xl font-black text-lg uppercase shadow-xl w-full max-w-xs gap-2 animate-pulse", theme.cta, theme.ctaText)}
            >
              <ShoppingCart size={20} /> {isService ? 'সার্ভিস বুক করতে চাই' : 'অর্ডার করতে চাই'}
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-12 px-8 rounded-xl bg-black text-white hover:bg-gray-900 border-none font-bold gap-3 w-full max-w-xs" asChild>
                <a href={`tel:${page.phone}`}><Phone size={18} className={isService ? "text-white" : "text-[#FFD700]"} /> {page.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 2. INGREDIENTS / SERVICES LIST SECTION */}
      {page.ingredients && page.ingredients.length > 0 && (
        <section className="py-12 bg-gray-50 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className={cn("text-xl font-black text-center mb-10 uppercase", theme.secondary)}>{isService ? 'আমাদের বিশেষ সেবাসমূহ' : 'যে সকল উপাদানে তৈরি?'}</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {page.ingredients.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div className="relative w-16 h-16 md:w-24 md:h-24 bg-white border-2 border-gray-200 rounded-2xl p-1 shadow-sm overflow-hidden group-hover:border-primary transition-all">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-gray-600 text-center uppercase tracking-tighter">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. USAGE / DETAILS SECTION */}
      {page.usagePoints && page.usagePoints.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className={cn("text-white p-4 rounded-xl text-center mb-12 shadow-lg", theme.accent)}>
              <h2 className="font-black text-sm md:text-xl uppercase tracking-tight">{page.usageTitle || (isService ? 'কিভাবে কাজ করি?' : 'ব্যাবহারের নিয়ম')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                {page.usagePoints.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={cn("p-1.5 rounded-full mt-0.5", isService ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600")}><Check size={16} strokeWidth={4} /></div>
                    <p className="text-sm md:text-base font-bold text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border-8 border-gray-50 shadow-2xl">
                <Image src={page.usageImage || page.imageUrl} alt="Details" fill className="object-cover" unoptimized />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. TRUST SECTION */}
      {page.trustPoints && page.trustPoints.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className={cn("container mx-auto max-w-2xl bg-white p-10 rounded-[3rem] border shadow-xl", theme.border)}>
            <div className={cn("text-white p-4 rounded-xl text-center mb-10", theme.accent)}>
              <h2 className="font-black text-sm md:text-xl uppercase tracking-tight">{page.trustTitle || 'আস্থার কারণ'}</h2>
            </div>
            <div className="space-y-5">
              {page.trustPoints.map((p: string, i: number) => (
                <div key={i} className="flex items-start gap-4 border-b border-gray-50 pb-4 last:border-0">
                  <CheckCircle2 size={24} className={theme.secondary} />
                  <p className="text-sm md:text-base font-bold text-gray-700 leading-snug">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. STORAGE INFO (Only for Products) */}
      {!isService && page.storageText && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-xl border-4 border-dashed border-green-600 p-8 rounded-[2.5rem] bg-green-50/30 text-center">
            <h2 className="font-black text-red-700 text-xl uppercase mb-4 underline decoration-green-600">যেভাবে সংরক্ষণ করবেনঃ</h2>
            <p className="text-sm md:text-base font-bold text-gray-700 leading-loose italic">
              {page.storageText}
            </p>
          </div>
        </section>
      )}

      {/* 6. PRICING SECTION */}
      {packages.length > 0 && (
        <section className="py-16 px-4">
          <div className={cn("container mx-auto max-w-2xl p-10 rounded-[3rem] text-white text-center shadow-2xl space-y-8", isService ? "bg-gradient-to-r from-[#1E5F7A] to-[#2563EB]" : "bg-gradient-to-r from-[#8B0000] to-[#B22222]")}>
            <div className="grid grid-cols-1 gap-4">
              {packages.map((pkg: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPkgIndex(i)}
                  className={cn(
                    "p-6 rounded-2xl border-4 transition-all cursor-pointer flex justify-between items-center",
                    selectedPkgIndex === i ? "bg-white/20 border-white scale-105" : "bg-black/10 border-white/10"
                  )}
                >
                  <p className="text-base md:text-2xl font-black uppercase tracking-tight">{pkg.name}</p>
                  <p className="text-xl md:text-3xl font-black">৳{pkg.price}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-black/20 py-3 rounded-xl">
              <Zap size={16} fill="currentColor" /> {isService ? 'আজ বুক করলে বিশেষ ডিসকাউন্ট প্রযোজ্য' : 'ফ্রী হোম ডেলিভারি সারা দেশেই পাওয়া যাচ্ছে'}
            </p>
          </div>
        </section>
      )}

      {/* 7. ORDER FORM SECTION */}
      <section id="order-form" className="py-24 px-4 container mx-auto max-w-6xl">
        <div className={cn("text-white p-5 rounded-t-[2.5rem] text-center max-w-2xl mx-auto shadow-xl", theme.accent)}>
          <h2 className="font-black text-sm md:text-xl uppercase tracking-widest">{isService ? 'বুকিং করতে নিচের ফর্মটি পূরণ করুন' : 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন'}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className={cn("lg:col-span-7 bg-white p-8 md:p-12 rounded-b-[3rem] rounded-tl-[3rem] shadow-2xl border-t-8", isService ? "border-[#1E5F7A]" : "border-[#8B0000]")}>
            <form onSubmit={handleOrderSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার নাম</Label>
                  <div className="relative">
                    <User className={cn("absolute left-4 top-1/2 -translate-y-1/2", theme.secondary)} size={24} />
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="নাম লিখুন" 
                      className="h-16 pl-14 bg-gray-50 border-none rounded-2xl font-bold text-xl focus:bg-white transition-all shadow-inner" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ফোন নম্বর</Label>
                  <div className="relative">
                    <Phone className={cn("absolute left-4 top-1/2 -translate-y-1/2", theme.secondary)} size={24} />
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="০১XXXXXXXXX" 
                      className="h-16 pl-14 bg-gray-50 border-none rounded-2xl font-bold text-xl focus:bg-white transition-all shadow-inner" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{isService ? 'সেবার ঠিকানা' : 'পূর্ণ ঠিকানা'}</Label>
                <div className="relative">
                  <MapPin className={cn("absolute left-4 top-5", theme.secondary)} size={24} />
                  <Textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder={isService ? "আপনার বিস্তারিত ঠিকানা দিন যেখানে সার্ভিস প্রয়োজন" : "আপনার বিস্তারিত ঠিকানা দিন (বাসা নং, রোড নং, এলাকা)"} 
                    className="min-h-[150px] pl-14 pt-5 bg-gray-50 border-none rounded-2xl font-bold text-xl focus:bg-white transition-all shadow-inner" 
                    required 
                  />
                </div>
              </div>

              {isSuccess ? (
                <div className="p-10 bg-green-50 rounded-[2.5rem] text-center border-4 border-green-100 animate-in zoom-in">
                  <CheckCircle2 className="text-green-600 mx-auto mb-4" size={64} />
                  <h3 className="font-black text-green-800 text-2xl uppercase">{isService ? 'বুকিং সফল হয়েছে!' : 'অর্ডার সফল হয়েছে!'}</h3>
                  <p className="text-green-700 font-bold mt-2">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isOutOfStock} 
                  className={cn("w-full h-20 rounded-2xl text-white font-black text-2xl uppercase shadow-2xl transform active:scale-95 transition-all", theme.accent, theme.accentHover)}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-10 w-10" /> : (isService ? "বুকিং সম্পন্ন করুন →" : "অর্ডার সম্পন্ন করুন →")}
                </Button>
              )}
            </form>
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <Card className={cn("rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white border-t-[16px]", isService ? "border-[#1E5F7A]" : "border-[#8B0000]")}>
              <CardContent className="p-10 space-y-8">
                <div className="flex items-center gap-6 border-b pb-8">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-gray-100 bg-gray-50 shrink-0 shadow-lg">
                    <Image src={linkedProduct?.imageUrl || page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-black text-gray-900 uppercase text-sm leading-tight line-clamp-2">
                      {page.title} {selectedPackage && `(${selectedPackage.name})`}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"><Minus size={16}/></button>
                      <span className="font-black text-2xl text-primary">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">
                    <span>{isService ? 'সার্ভিস চার্জ' : 'প্রোডাক্ট প্রাইজ'}</span>
                    <span className="text-gray-900 font-black">৳{price}</span>
                  </div>
                  {!isService && (
                    <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="text-blue-600 font-black">৳{deliveryCharge}</span>
                    </div>
                  )}
                  {regularPrice > price && (
                    <div className="flex justify-between text-[11px] font-black uppercase text-green-600 tracking-[0.2em]">
                      <span>আপনার সাশ্রয়</span>
                      <span className="font-black">-৳{(regularPrice - price) * quantity}</span>
                    </div>
                  )}
                  <div className="pt-8 border-t-4 border-dashed border-gray-50 flex justify-between items-end">
                    <div>
                      <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] mb-2", theme.secondary)}>সর্বমোট টাকা</p>
                      <p className="text-5xl font-black text-gray-900 tracking-tighter">৳{totalPrice}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] px-4 py-1.5 rounded-full">CASH ON DELIVERY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-15px-50px_rgba(0,0,0,0.15)] flex gap-3">
        <div className="flex flex-col justify-center pl-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">মোট টাকা</p>
          <p className={cn("text-2xl font-black tracking-tighter", theme.secondary)}>৳{totalPrice}</p>
        </div>
        <Button onClick={scrollToForm} className={cn("h-14 flex-1 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl", theme.cta, theme.ctaText)}>
          {isService ? 'বুকিং করুন' : 'অর্ডার করুন'} <ArrowRight size={20} className="ml-2" />
        </Button>
      </div>

    </div>
  );
}
