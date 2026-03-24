
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
  TrendingUp,
  ArrowRight,
  XCircle,
  Zap,
  Star,
  Award,
  Plus,
  Minus,
  MessageCircle,
  X,
  LayoutGrid
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Linked Product
  const productRef = useMemoFirebase(() => (db && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page?.productId]);
  const { data: linkedProduct } = useDoc(productRef);

  // 3. Fetch Best Selling
  const bestSellingQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'products'), where('isBestSelling', '==', true), limit(8)) : null, [db]);
  const { data: bestSelling } = useCollection(bestSellingQuery);

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  const isOutOfStock = linkedProduct && (linkedProduct.stockQuantity <= 0);
  
  const currentCategory = page?.pricingCategories?.[activeCategory];
  const currentPackage = currentCategory?.packages?.[selectedPkgIndex];

  const price = currentPackage?.price || page?.discountPrice || page?.price || linkedProduct?.price || 0;
  const regularPrice = currentPackage?.originalPrice || page?.price || linkedProduct?.regularPrice || linkedProduct?.price || 0;
  const discountAmount = regularPrice > price ? regularPrice - price : 0;
  const deliveryCharge = 60;
  const totalPrice = price + deliveryCharge;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "আপনার নাম, ফোন এবং ঠিকানা দিন।" });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        status: 'New',
        source: page.slug,
        serviceTitle: page.type === 'service' ? (currentPackage ? `${currentCategory?.name} - ${currentPackage.name}` : page.title) : null,
        items: [{
          id: page.productId || page.id,
          name: page.type === 'service' ? (currentPackage ? `${currentCategory?.name} - ${currentPackage.name}` : page.title) : page.title,
          price: price,
          quantity: 1
        }],
        totalPrice: totalPrice,
        createdAt: new Date().toISOString(),
        riskLevel: 'Low',
        isSuspicious: false
      };

      const coll = page.type === 'service' ? 'bookings' : 'orders';
      await addDoc(collection(db, coll), orderData);
      
      if (page.productId) {
        await updateDoc(doc(db, 'products', page.productId), {
          stockQuantity: increment(-1)
        });
      }

      trackEvent('Purchase', { value: totalPrice, currency: 'BDT', content_name: page.title });
      setIsSuccess(true);
      
      const waMsg = `আসসালামু আলাইকুম, আমি ${orderData.serviceTitle || page.title} বুকিং দিতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nটোটাল: ৳${totalPrice}`;
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      setTimeout(() => router.push('/order-success?id=success'), 2000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "অর্ডার সম্পন্ন করা যায়নি।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
  if (!page || !page.active) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-body text-[#333] pb-24">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#8B0000] to-[#B22222] pt-10 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Zap size={400} className="absolute -top-20 -left-20 text-white" />
        </div>
        
        <div className="container mx-auto max-w-5xl space-y-8 text-center relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none italic drop-shadow-xl">
              {page.heroTitle || page.title}
            </h1>
            <p className="text-white/80 text-sm md:text-xl font-medium max-w-2xl mx-auto">
              {page.heroSubtitle || page.subtitle || page.offer}
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/10 group">
            {page.useCustomBanner && page.bannerImage ? (
              <Image src={page.bannerImage} alt={page.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority unoptimized />
            ) : page.videoUrl ? (
              <iframe src={`https://www.youtube.com/embed/${page.videoUrl.split('v=')[1] || page.videoUrl.split('/').pop()}`} className="w-full h-full" allowFullScreen />
            ) : (
              <Image src={page.imageUrl} alt={page.title} fill className="object-cover" priority unoptimized />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button onClick={scrollToForm} className="h-16 px-12 rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-xl uppercase shadow-xl animate-pulse w-full md:w-auto border-b-4 border-black/20">
              🛒 বুকিং দিতে চাই
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-16 px-8 rounded-2xl border-none bg-black text-white hover:bg-gray-900 font-black text-lg uppercase gap-3 w-full md:w-auto" asChild>
                <a href={`tel:${page.phone}`}><Phone size={20} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldCheck size={14} className="text-[#FFD700]" /> {page.stockText || 'অফারটি সীমিত সময়ের জন্য'}
          </div>
        </div>
      </section>

      {/* CURVED DIVIDER */}
      <div className="-mt-12 relative z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="fill-[#F9FAFB] w-full h-auto"><path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path></svg>
      </div>

      {/* 2. INCLUDING / SERVICES SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter leading-none">Including / সার্ভিসসমূহ</h2>
            <div className="w-20 h-1.5 bg-[#59C1BD] mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {(page.includingItems || [
              { title: 'ডিপ ক্লিনিং', image: 'https://picsum.photos/seed/clean1/400/400', description: 'ঘরের প্রতিটি কোণ পরিষ্কার' },
              { title: 'এসি সার্ভিস', image: 'https://picsum.photos/seed/clean2/400/400', description: 'মাস্টার ওয়াশ ও গ্যাস রিফিল' },
              { title: 'সোফা ক্লিনিং', image: 'https://picsum.photos/seed/clean3/400/400', description: 'শ্যাম্পু ও ড্রাই ক্লিনিং' },
              { title: 'কিচেন হুড', image: 'https://picsum.photos/seed/clean4/400/400', description: 'তৈলাক্ত ময়লা পরিষ্কার' },
              { title: 'ফ্লোর পলিশিং', image: 'https://picsum.photos/seed/clean5/400/400', description: 'মেঝের উজ্জ্বলতা বৃদ্ধি' }
            ]).map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 hover:shadow-xl hover:scale-105 transition-all duration-500 group">
                <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gray-50 border group-hover:rotate-6 transition-transform">
                  <Image src={item.image} alt={item.title} fill className="object-cover p-2" unoptimized />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-gray-900 uppercase text-[11px] md:text-sm tracking-tight">{item.title}</h4>
                  <p className="text-[9px] md:text-xs text-gray-400 font-bold uppercase tracking-tighter">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DETAILS SECTION */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-[#081621] uppercase tracking-tighter leading-none italic">বিস্তারিত</h2>
                <div className="w-24 h-2 bg-[#8B0000] rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(page.detailsContent?.features || [
                  { title: 'দক্ষ কর্মী', description: 'আমাদের আছে দীর্ঘ অভিজ্ঞতা সম্পন্ন প্রশিক্ষণপ্রাপ্ত কর্মী।' },
                  { title: 'আধুনিক প্রযুক্তি', description: 'আমরা ব্যবহার করি উচ্চমানের আধুনিক ক্লিনিং মেশিন।' },
                  { title: 'নিরাপদ কেমিক্যাল', description: 'পরিবেশ বান্ধব ও মানুষের জন্য নিরাপদ কেমিক্যাল।' },
                  { title: 'দ্রুত সেবা', description: 'আপনার প্রয়োজন অনুযায়ী দ্রুত সময়ে সেবা প্রদান।' }
                ]).map((feat: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-2 group hover:border-[#59C1BD] transition-colors">
                    <div className="p-2 bg-gray-50 rounded-xl w-fit group-hover:bg-[#59C1BD]/10 transition-colors">
                      <CheckCircle2 size={24} className="text-[#59C1BD]" />
                    </div>
                    <h4 className="font-black text-[#081621] uppercase text-xs tracking-tight">{feat.title}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-3xl border-[12px] border-white bg-white group">
              <Image src={page.imageUrl} alt="Details" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-10">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-white">
                  <p className="text-lg font-bold leading-relaxed">"{page.description?.slice(0, 100)}..."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">আমাদের প্যাকেজসমূহ</h2>
          <div className="w-20 h-1.5 bg-[#8B0000] mx-auto rounded-full" />
        </div>

        {page.pricingCategories ? (
          <div className="space-y-12">
            <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
              {page.pricingCategories.map((cat: any, i: number) => (
                <button
                  key={i}
                  onClick={() => { setActiveCategory(i); setSelectedPkgIndex(0); }}
                  className={cn(
                    "px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                    activeCategory === i ? "bg-[#8B0000] text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {page.pricingCategories[activeCategory].packages.map((pkg: any, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedPkgIndex(idx)}
                  className={cn(
                    "relative bg-white rounded-[2.5rem] p-10 shadow-xl border-4 transition-all duration-500 cursor-pointer group",
                    selectedPkgIndex === idx ? "border-[#8B0000] scale-105 shadow-red-900/10" : "border-transparent hover:border-gray-200"
                  )}
                >
                  {idx === 1 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black font-black text-[9px] px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">RECOMMENDED</div>
                  )}
                  <div className="text-center space-y-6">
                    <h4 className="text-xl font-black text-[#081621] uppercase tracking-tighter">{pkg.name}</h4>
                    <div className="space-y-1">
                      <p className="text-4xl font-black text-[#8B0000] tracking-tighter leading-none">৳{pkg.price}</p>
                      {pkg.originalPrice && <p className="text-xs text-gray-400 line-through font-bold">৳{pkg.originalPrice}</p>}
                    </div>
                    <ul className="space-y-3 pt-6 border-t">
                      {['সার্ভিস ভ্যাট অন্তর্ভুক্ত', '১০০% গ্যারান্টি', 'প্রশিক্ষিত কর্মী'].map((l, j) => (
                        <li key={j} className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                          <CheckCircle2 size={14} className="text-[#59C1BD]" /> {l}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={cn(
                        "w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md",
                        selectedPkgIndex === idx ? "bg-[#8B0000] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                      )}
                    >
                      {selectedPkgIndex === idx ? 'সিলেক্ট করা হয়েছে' : 'প্যাকেজটি নিন'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-20 text-center bg-white rounded-[3rem] shadow-xl border-2 border-dashed text-muted-foreground italic">
            প্যাকেজ সেট করা হয়নি।
          </div>
        )}
      </section>

      {/* 5. ORDER / BOOKING SECTION */}
      <section id="order-section" className="py-20 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">বুকিং করতে নিচের ফর্মটি পূরণ করুন</h2>
          <div className="w-24 h-1.5 bg-[#8B0000] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Order Summary (First on Mobile) */}
          <div className="lg:col-span-5 space-y-6 lg:order-2 lg:sticky lg:top-24">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white border-t-[12px] border-[#8B0000]">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-[#081621] uppercase text-xs leading-tight line-clamp-2">
                      {page.type === 'service' ? (currentPackage ? `${currentCategory?.name} - ${currentPackage.name}` : page.title) : page.title}
                    </h4>
                    <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[9px]">Quantity: 1</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <span>প্যাকেজ প্রাইস</span>
                    <span className="text-[#081621]">৳{price}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[10px] font-black text-[#B22222] uppercase tracking-[0.2em]">
                      <span>ডিসকাউন্ট অফার 🔥</span>
                      <span>- ৳{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <span>ডেলিভারি চার্জ / অন্যান্য</span>
                    <span className="text-blue-600">৳{deliveryCharge}</span>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-[#B22222] uppercase tracking-[0.3em] mb-2">সর্বমোট পেবল</p>
                      <p className="text-5xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice}</p>
                    </div>
                    <div className="bg-[#B22222]/10 text-[#B22222] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">BDT</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-[2rem] bg-[#59C1BD]/10 border border-[#59C1BD]/20 flex items-center gap-4 text-[#59C1BD] font-black uppercase tracking-widest text-[10px]">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><ShieldCheck size={24} /></div>
              Cash on Delivery Available
            </div>
          </div>

          {/* Form Card (Desktop Left) */}
          <div className="lg:col-span-7 lg:order-1">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardContent className="p-8 md:p-12 space-y-10">
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">আপনার নাম</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="আপনার নাম লিখুন" 
                          className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ফোন নম্বর</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                        <Input 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          placeholder="০১XXXXXXXXX" 
                          className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পূর্ণ ঠিকানা</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-[#8B0000]" size={20} />
                      <Textarea 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                        placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" 
                        className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">অতিরিক্ত নোট (ঐচ্ছিক)</Label>
                    <Textarea 
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})} 
                      placeholder="সার্ভিস সংক্রান্ত কোনো বিশেষ নির্দেশ থাকলে লিখুন" 
                      className="min-h-[80px] bg-gray-50 border-none rounded-2xl font-medium focus:bg-white transition-all shadow-inner" 
                    />
                  </div>

                  {isOutOfStock ? (
                    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center space-y-2">
                      <XCircle className="mx-auto text-red-600" size={32} />
                      <h3 className="font-black text-red-800 uppercase">Stock Out</h3>
                      <p className="text-xs font-bold text-red-700">দুঃখিত, এই মুহূর্তে সার্ভিসটি বন্ধ আছে।</p>
                    </div>
                  ) : isSuccess ? (
                    <div className="p-10 bg-green-50 border border-green-100 rounded-[2rem] text-center space-y-2 animate-in zoom-in-95">
                      <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm"><CheckCircle2 className="text-green-600" size={48} /></div>
                      <h3 className="font-black text-green-800 uppercase text-xl mt-4">বুকিং সফল হয়েছে!</h3>
                      <p className="text-xs font-bold text-green-700">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                    </div>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="w-full h-20 rounded-[2rem] bg-[#8B0000] hover:bg-[#B22222] text-white font-black text-2xl uppercase shadow-2xl active:scale-95 transition-all border-b-8 border-black/20">
                      {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : "বুকিং সম্পন্ন করুন →"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#081621] text-white/40 text-center">
        <div className="container mx-auto px-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Copyright © 2026 Smart Clean Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] safe-area-pb">
        <Button onClick={scrollToForm} className="h-14 w-full rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-sm uppercase tracking-widest shadow-xl border-none">
          বুকিং দিতে চাই <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>

      {/* FLOATING MULTI-SERVICE BUTTON */}
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[200]">
        <button 
          onClick={() => setIsHubOpen(true)}
          className="w-16 h-16 rounded-full bg-[#59C1BD] text-white shadow-2xl shadow-[#59C1BD]/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-all group"
        >
          <LayoutGrid size={32} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black animate-bounce">NEW</span>
        </button>
      </div>

      {/* SERVICE HUB DIALOG */}
      <Dialog open={isHubOpen} onOpenChange={setIsHubOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl"><Zap size={20} /></div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">আমাদের সেবাসমূহ</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {(page.floatingServices || [
                { name: 'ডিপ ক্লিনিং', image: 'https://picsum.photos/seed/s1/200/200', link: '/deep-cleaning' },
                { name: 'এসি সার্ভিস', image: 'https://picsum.photos/seed/s2/200/200', link: '/ac-service' },
                { name: 'সোফা ওয়াশ', image: 'https://picsum.photos/seed/s3/200/200', link: '/sofa-wash' },
                { name: 'পোকামাকড় দমন', image: 'https://picsum.photos/seed/s4/200/200', link: '/pest-control' },
                { name: 'ট্যাংক ক্লিনিং', image: 'https://picsum.photos/seed/s5/200/200', link: '/tank-clean' }
              ]).map((s: any, idx: number) => (
                <Link 
                  key={idx} 
                  href={s.link} 
                  className="min-w-[120px] bg-gray-50 rounded-[2rem] p-4 flex flex-col items-center text-center gap-3 hover:bg-primary/5 transition-colors border border-gray-100"
                  onClick={() => setIsHubOpen(false)}
                >
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border">
                    <Image src={s.image} alt={s.name} fill className="object-cover p-2" unoptimized />
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-700 tracking-tighter leading-none">{s.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t flex flex-col gap-4">
              <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest">২৪/৭ কাস্টমার সাপোর্ট</p>
              <Button className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] font-black gap-2 uppercase text-xs" asChild>
                <a href={`https://wa.me/${page.phone || '8801919640422'}`} target="_blank">
                  <MessageCircle size={20} /> সরাসরি হোয়াটসঅ্যাপে কথা বলুন
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
