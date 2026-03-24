
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
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
  Wrench,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Info,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection States
  const [quantity, setQuantity] = useState(1);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', tranId: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page Config
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Grid Items (Products or Services)
  const gridItemsQuery = useMemoFirebase(() => {
    if (!db || !page?.productIds?.length) return null;
    const colName = page.type === 'service' ? 'services' : 'products';
    return query(collection(db, colName), where('status', '==', 'Active'), limit(8));
  }, [db, page]);
  const { data: gridItems } = useCollection(gridItemsQuery);

  const mainProduct = gridItems?.[0];

  // 3. Auto-select default package
  useEffect(() => {
    if (page?.type === 'service' && page.packages?.length) {
      const def = page.packages.find((p: any) => p.isDefault) || page.packages[0];
      setSelectedPkgId(def.id);
    }
  }, [page]);

  // 4. Pricing Calculations
  const calculations = useMemo(() => {
    if (!page) return { subtotal: 0, discount: 0, total: 0 };

    let subtotal = 0;
    let delivery = 0;
    let additional = 0;

    if (page.type === 'product') {
      const unitPrice = mainProduct?.price || 0;
      subtotal = unitPrice * quantity;
      delivery = page.deliveryCharge || 0;
    } else {
      const pkg = page.packages?.find((p: any) => p.id === selectedPkgId);
      const pkgPrice = pkg?.price || 0;
      const addOnPrice = page.addOns?.filter((a: any) => selectedAddOnIds.includes(a.id)).reduce((acc: number, a: any) => acc + (a.price || 0), 0) || 0;
      subtotal = pkgPrice + addOnPrice;
      additional = page.additionalCharge || 0;
    }

    let discount = 0;
    if (page.discountType === 'percent') {
      discount = (subtotal * (page.discountValue || 0)) / 100;
    } else {
      discount = page.discountValue || 0;
    }

    const total = subtotal + (page.type === 'product' ? delivery : additional) - discount;

    return { subtotal, discount, delivery, additional, total };
  }, [page, mainProduct, quantity, selectedPkgId, selectedAddOnIds]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "Information Required", description: "All fields are required." });
      return;
    }

    if (paymentMethod !== 'cod' && !formData.tranId) {
      toast({ variant: "destructive", title: "Transaction ID Required", description: "Please provide payment reference." });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        pageId: page.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        paymentMethod,
        transactionId: formData.tranId || null,
        subtotal: calculations.subtotal,
        discount: calculations.discount,
        totalPrice: calculations.total,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      if (page.type === 'product') {
        const finalOrder = {
          ...orderData,
          items: [{ id: mainProduct?.id, name: mainProduct?.name, price: mainProduct?.price, quantity }],
          deliveryCharge: calculations.delivery
        };
        await addDoc(collection(db, 'orders_products'), finalOrder);
        if (mainProduct) {
          await updateDoc(doc(db, 'products', mainProduct.id), { stockQuantity: increment(-quantity) });
        }
      } else {
        const finalOrder = {
          ...orderData,
          package: page.packages?.find((p: any) => p.id === selectedPkgId),
          selectedAddOns: page.addOns?.filter((a: any) => selectedAddOnIds.includes(a.id)),
          additionalCharge: calculations.additional
        };
        await addDoc(collection(db, 'orders_services'), finalOrder);
      }

      toast({ title: "Success", description: "Order confirmed successfully!" });
      router.push(`/order-success?id=${slug}&type=${page.type}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center uppercase font-black tracking-widest text-gray-300">Page Not Available</div>;

  const isProduct = page.type === 'product';
  const themeColor = isProduct ? "bg-[#D60000]" : "bg-blue-600";

  return (
    <PublicLayout minimalMobile={true}>
      <div className="min-h-screen bg-white pb-20">
        
        {/* 🔴 HERO SECTION */}
        <section className={cn("text-white pt-6 md:pt-10 pb-12 md:pb-20 px-4", themeColor)}>
          <div className="container mx-auto max-w-5xl text-center space-y-6 md:space-y-8">
            <div className="relative aspect-[21/10] md:aspect-[21/9] w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
              {typeof page.bannerImage === 'string' && page.bannerImage ? (
                <NextImage src={page.bannerImage} alt="Banner" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-black/20 flex items-center justify-center"><Zap size={60} className="opacity-20" /></div>
              )}
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight italic">{page.heroTitle || page.title}</h1>
              <p className="text-white/80 text-xs md:text-xl font-medium max-w-2xl mx-auto">{page.heroSubtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-black font-black text-lg md:text-xl uppercase shadow-xl gap-2 flex items-center justify-center" 
                onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingCart size={24} /> {isProduct ? 'অর্ডার করতে চাই' : 'বুকিং দিতে চাই'}
              </button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-2xl bg-black text-white border-none font-black text-lg md:text-xl hover:bg-gray-900 gap-2 shadow-xl" asChild>
                <a href={`tel:${page.phone || '01919640422'}`}>
                  <Phone size={24} /> {page.phone || '01919640422'}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* 📦 DYNAMIC GRID SECTION */}
        {gridItems && gridItems.length > 0 && (
          <section className="py-8 md:py-12 bg-gray-50/50 border-b border-gray-100 overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900">{isProduct ? 'পণ্যসমূহ' : 'সেবাসমূহ'}</h2>
                <Badge variant="outline" className="font-bold border-gray-300">Top Choices</Badge>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 px-2 no-scrollbar scroll-smooth">
                {gridItems.map((item) => (
                  <div key={item.id} className="min-w-[140px] md:min-w-[160px] bg-white rounded-2xl p-3 border shadow-sm hover:shadow-md transition-all group flex flex-col gap-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
                      <NextImage 
                        src={(typeof item.imageUrl === 'string' && item.imageUrl) ? item.imageUrl : 'https://picsum.photos/seed/item/200/200'} 
                        data-ai-hint="item image" 
                        alt={item.name || item.title} 
                        fill 
                        className="object-cover transition-transform group-hover:scale-110" 
                        unoptimized 
                      />
                    </div>
                    <div className="space-y-1 mt-1">
                      <h4 className="font-bold text-[10px] uppercase truncate text-gray-800 leading-tight">{item.name || item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-black text-xs">৳{item.price || item.basePrice}</span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ✨ FEATURES SECTION */}
        {page.features?.length > 0 && (
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl md:text-5xl font-black text-center uppercase tracking-tighter text-gray-900 mb-10 md:mb-16">
                {page.featuresTitle || 'কেন এটি আপনার জন্য সেরা?'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {page.features.map((f: any, i: number) => (
                  <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 md:gap-4 hover:shadow-xl transition-all">
                    <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden bg-gray-50 p-2">
                      <NextImage 
                        src={(typeof f.imageUrl === 'string' && f.imageUrl) ? f.imageUrl : 'https://picsum.photos/seed/feat/100/100'} 
                        data-ai-hint="feature icon" 
                        alt={f.title} 
                        fill 
                        className="object-contain" 
                        unoptimized 
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-[10px] md:text-xs text-gray-900">{f.title}</h4>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-medium leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 📋 DETAILS SECTION */}
        {page.detailsText && (
          <section className="py-16 md:py-24 bg-gray-50/50 border-y border-gray-100">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="space-y-6 md:space-y-8">
                  <Badge className="bg-primary/10 text-primary border-none uppercase font-black tracking-widest px-4 py-1.5 rounded-full text-[10px]">Product Details</Badge>
                  <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight text-gray-900">{page.detailsTitle || 'বিস্তারিত তথ্য'}</h2>
                  <div className="prose prose-slate max-w-none text-gray-600 font-medium leading-loose text-sm md:text-lg">
                    {page.detailsText}
                  </div>
                  <Button onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-xl font-black uppercase shadow-lg">অর্ডার করুন <ArrowRight size={20} className="ml-2" /></Button>
                </div>
                {typeof page.detailsImage === 'string' && page.detailsImage && (
                  <div className="relative aspect-square rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white">
                    <NextImage src={page.detailsImage} alt="Details" fill className="object-cover" unoptimized />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ✅ WHY CHOOSE SECTION */}
        {page.whyItems?.length > 0 && (
          <section className={cn("py-12 md:py-20 text-white", themeColor)}>
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter mb-8 md:mb-12">{page.whyTitle || 'আমাদের ওপর কেন আস্থা রাখবেন?'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-left">
                {page.whyItems.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 md:gap-4 bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                    <div className="p-2 bg-yellow-400 rounded-lg text-black shrink-0"><CheckCircle2 size={18} /></div>
                    <span className="font-bold text-xs md:sm uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 🛒 ORDER / BOOKING SECTION */}
        <section id="order-section" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10 md:mb-16 space-y-2">
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-gray-900">বুকিং সম্পন্ন করুন</h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">নিচের ফর্মটি নির্ভুলভাবে পূরণ করুন</p>
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-10 items-start">
              {/* Form */}
              <div className="lg:col-span-7 w-full">
                <Card className="rounded-2xl md:rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                  <CardHeader className={cn("p-6 md:p-8 text-white", themeColor)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl"><User size={24} /></div>
                      <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight">কাস্টমার তথ্য</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">আপনার নাম</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="নাম লিখুন" className="h-12 md:h-14 bg-gray-50 border-none rounded-xl md:rounded-2xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ফোন নম্বর</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-12 md:h-14 bg-gray-50 border-none rounded-xl md:rounded-2xl font-bold" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পূর্ণ ঠিকানা</Label>
                      <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="বাসা, রোড, এলাকা" className="min-h-[100px] md:min-h-[120px] bg-gray-50 border-none rounded-xl md:rounded-2xl font-bold p-4 md:p-6" />
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4 pt-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পেমেন্ট পদ্ধতি</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className={cn("flex items-center gap-4 p-4 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'cod' ? "border-primary bg-primary/5" : "bg-white border-gray-100")}>
                          <RadioGroupItem value="cod" id="cod" className="sr-only" />
                          <label htmlFor="cod" className="flex items-center gap-3 font-black text-[10px] md:text-xs uppercase cursor-pointer w-full">
                            <div className={cn("p-2 rounded-lg", paymentMethod === 'cod' ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}><Smartphone size={16} /></div>
                            ক্যাশ অন ডেলিভারি
                          </label>
                        </div>
                        <div className={cn("flex items-center gap-4 p-4 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'bkash' ? "border-pink-600 bg-pink-50" : "bg-white border-gray-100")}>
                          <RadioGroupItem value="bkash" id="bkash" className="sr-only" />
                          <label htmlFor="bkash" className="flex items-center gap-3 font-black text-[10px] md:text-xs uppercase cursor-pointer w-full">
                            <div className={cn("p-2 rounded-lg", paymentMethod === 'bkash' ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-400")}><Smartphone size={16} /></div>
                            বিকাশ / নগদ
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {paymentMethod !== 'cod' && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase text-pink-600 ml-1">Transaction ID (বিকাশ সেন্ড মানি করার পর লিখুন)</Label>
                        <Input value={formData.tranId} onChange={e => setFormData({...formData, tranId: e.target.value})} placeholder="TRX12345678" className="h-12 md:h-14 bg-pink-50 border-pink-200 rounded-xl md:rounded-2xl font-mono text-base md:text-lg font-black" />
                      </div>
                    )}

                    <Button onClick={handleOrder} disabled={isSubmitting} className={cn("w-full h-16 md:h-20 rounded-2xl md:rounded-3xl font-black text-xl md:text-2xl uppercase shadow-2xl transition-all active:scale-95", themeColor, "text-white")}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'অর্ডার সম্পন্ন করুন'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <div className="lg:col-span-5 w-full lg:sticky lg:top-24">
                <Card className="rounded-2xl md:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-yellow-400">
                  <CardHeader className="p-6 md:p-8 border-b bg-gray-50/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900">অর্ডার সামারি</CardTitle>
                    <ShoppingCart size={20} className="text-primary" />
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                    {isProduct ? (
                      <div className="flex gap-4 items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden border bg-gray-50">
                          <NextImage 
                            src={(typeof mainProduct?.imageUrl === 'string' && mainProduct.imageUrl) ? mainProduct.imageUrl : 'https://picsum.photos/seed/product/200/200'} 
                            data-ai-hint="product image" 
                            alt="Summary" 
                            fill 
                            className="object-cover" 
                            unoptimized 
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-black text-gray-900 uppercase text-[10px] md:text-xs leading-tight line-clamp-2">{mainProduct?.name}</h4>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-11 flex items-center justify-center bg-gray-100 rounded-lg active:scale-90 transition-transform"><Minus size={16} /></button>
                            <span className="font-black text-sm">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="h-11 w-11 flex items-center justify-center bg-gray-100 rounded-lg active:scale-90 transition-transform"><Plus size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Service Packages */}
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">প্যাকেজ নির্বাচন করুন</Label>
                          {page.packages?.map((pkg: any) => (
                            <div key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)} className={cn("p-4 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center", selectedPkgId === pkg.id ? "border-blue-600 bg-blue-50" : "border-gray-50 bg-white")}>
                              <div className="space-y-0.5">
                                <p className="font-black text-[10px] md:text-[11px] uppercase">{pkg.name}</p>
                                <div className="flex gap-1">
                                  {pkg.features?.slice(0, 2).map((f: string, idx: number) => <span key={idx} className="text-[7px] md:text-[8px] font-bold text-gray-400">✓ {f}</span>)}
                                </div>
                              </div>
                              <span className="font-black text-blue-600 text-sm md:text-base">৳{pkg.price}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add-ons System */}
                        {page.addOns?.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">অ্যাড-অন সার্ভিস (ঐচ্ছিক)</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {page.addOns.filter((a: any) => a.enabled !== false).map((add: any) => (
                                <div 
                                  key={add.id} 
                                  onClick={() => setSelectedAddOnIds(prev => prev.includes(add.id) ? prev.filter(i => i !== add.id) : [...prev, add.id])} 
                                  className={cn(
                                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group", 
                                    selectedAddOnIds.includes(add.id) ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"
                                  )}
                                >
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-50">
                                      <NextImage 
                                        src={(typeof add.imageUrl === 'string' && add.imageUrl) ? add.imageUrl : 'https://picsum.photos/seed/addon/100/100'} 
                                        data-ai-hint="addon icon" 
                                        alt={add.name} 
                                        fill 
                                        className="object-cover" 
                                        unoptimized 
                                      />
                                    </div>
                                    <span className="text-[9px] md:text-[10px] font-bold uppercase text-gray-700">{add.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <span className="font-black text-[9px] md:text-[10px] text-blue-600">+৳{add.price}</span>
                                    <div className={cn("w-6 h-6 rounded border-2 flex items-center justify-center transition-all", selectedAddOnIds.includes(add.id) ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200")}>
                                      {selectedAddOnIds.includes(add.id) && <Plus size={14} strokeWidth={4} />}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                        <span>সাব-টোটাল</span>
                        <span className="text-gray-900">৳{calculations.subtotal}</span>
                      </div>
                      {calculations.discount > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase text-green-600">
                          <span>ডিসকাউন্ট</span>
                          <span>-৳{calculations.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
                        <span>{isProduct ? 'ডেলিভারি চার্জ' : 'অ্যাডিশনাল চার্জ'}</span>
                        <span>৳{isProduct ? calculations.delivery : calculations.additional}</span>
                      </div>
                      <div className="pt-6 border-t-4 border-dashed flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">মোট প্রদেয়</p>
                          <p className={cn("text-3xl md:text-4xl font-black tracking-tighter", isProduct ? "text-[#D60000]" : "text-blue-600")}>৳{calculations.total}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] px-3 py-1">পেমেন্ট সিকিউরড</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl md:rounded-2xl border border-yellow-100 flex items-start gap-3">
                      <Info size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-yellow-800 leading-relaxed uppercase">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। অর্ডার কনফার্ম করতে কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই (যদি না অনলাইন পেমেন্ট বেছে নেন)।</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 📌 MOBILE STICKY CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t p-4 flex gap-4 items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] safe-area-pb">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Total Payable</span>
            <span className={cn("text-xl md:text-2xl font-black tracking-tighter leading-none", isProduct ? "text-[#D60000]" : "text-blue-600")}>৳{calculations.total}</span>
          </div>
          <Button className={cn("flex-1 h-14 md:h-16 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs shadow-xl", themeColor, "text-white")} onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}>
            বুকিং সম্পন্ন করুন →
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
