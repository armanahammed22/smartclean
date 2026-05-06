'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  Phone, 
  ShoppingCart, 
  User, 
  Loader2,
  Zap,
  Plus,
  Minus,
  ArrowRight,
  Smartphone,
  Info,
  ChevronRight,
  Wallet,
  Star,
  Play,
  Clock,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PublicLayout } from '@/components/layout/public-layout';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', tranId: '' });

  // Countdown timer simulation
  const [timeLeft, setTimeLeft] = useState({ h: 11, m: 57, s: 52 });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  const gridItemsQuery = useMemoFirebase(() => {
    if (!db || !page?.productIds?.length) return null;
    const colName = page.type === 'service' ? 'services' : 'products';
    return query(collection(db, colName), where('status', '==', 'Active'), limit(8));
  }, [db, page]);
  const { data: gridItems } = useCollection(gridItemsQuery);

  const mainProduct = gridItems?.[0];

  useEffect(() => {
    if (page?.type === 'service' && page.packages?.length) {
      const def = page.packages.find((p: any) => p.isDefault) || page.packages[0];
      setSelectedPkgId(def.id);
    }
  }, [page]);

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

  const scrollToForm = () => {
    const el = document.getElementById('booking-form-start');
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য প্রয়োজন", description: "সবগুলো ফিল্ড পূরণ করুন।" });
      return;
    }

    setIsSubmitting(true);
    const targetCol = page.type === 'product' ? 'orders' : 'bookings';
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
      source: `landing_${slug}`,
      createdAt: new Date().toISOString()
    };

    const finalData = page.type === 'product' ? {
      ...orderData,
      items: [{ id: mainProduct?.id, name: mainProduct?.name, price: mainProduct?.price, quantity, itemType: 'product' }],
      deliveryCharge: calculations.delivery
    } : {
      ...orderData,
      serviceTitle: page.title,
      items: [
        { id: selectedPkgId, name: `Package: ${page.packages?.find((p: any) => p.id === selectedPkgId)?.name}`, price: page.packages?.find((p: any) => p.id === selectedPkgId)?.price, quantity: 1, itemType: 'service' },
        ...page.addOns?.filter((a: any) => selectedAddOnIds.includes(a.id)).map((a: any) => ({ id: a.id, name: a.name, price: a.price, quantity: 1, itemType: 'service' }))
      ],
      additionalCharge: calculations.additional
    };

    addDoc(collection(db, targetCol), finalData)
      .then(() => {
        if (page.type === 'product' && mainProduct) {
          updateDoc(doc(db, 'products', mainProduct.id), { stockQuantity: increment(-quantity) });
        }
        toast({ title: "সফল হয়েছে", description: "আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।" });
        router.push(`/order-success?id=${page.id}&type=${page.type}`);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: targetCol,
          operation: 'create',
          requestResourceData: finalData
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center uppercase font-black tracking-widest text-gray-300">Page Not Available</div>;

  const isProduct = page.type === 'product';
  const primaryColor = "#008000"; // Deep Green from reference

  return (
    <PublicLayout minimalMobile={true}>
      <div className="min-h-screen bg-white">
        
        {/* ⏰ TOP URGENCY BAR */}
        <div className="bg-[#f0f0f0] border-b py-2 px-4 sticky top-0 z-[100] shadow-sm">
           <div className="container mx-auto max-w-4xl flex items-center justify-between">
              <div className="bg-red-600 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded flex items-center gap-1.5 animate-pulse">
                 <Zap size={14} fill="white" /> অফার প্রাইসে দ্রুত অর্ডার করুন
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1 text-gray-700 font-black text-xs md:text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span>{timeLeft.h.toString().padStart(2, '0')}</span> :
                    <span>{timeLeft.m.toString().padStart(2, '0')}</span> :
                    <span>{timeLeft.s.toString().padStart(2, '0')}</span>
                 </div>
                 <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">DAYS HRS MINS SECS</span>
              </div>
           </div>
        </div>

        {/* 🎯 HERO SECTION */}
        <section className="bg-green-700 text-white py-10 md:py-16 px-4">
          <div className="container mx-auto max-w-5xl text-center space-y-8 md:space-y-12">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
                {page.heroTitle || page.title}
              </h1>
              <p className="text-white/80 text-sm md:text-xl font-medium max-w-2xl mx-auto border-t border-white/20 pt-4 italic">
                {page.heroSubtitle || "সেরা মানে প্রফেশনাল সেবা এখন আপনার হাতের নাগালে"}
              </p>
            </div>

            <div className="relative bg-white rounded-2xl md:rounded-[3rem] p-4 md:p-10 shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center border-[6px] border-white/20">
               <div className="w-full md:w-1/2 relative aspect-square rounded-xl overflow-hidden shadow-inner bg-gray-50">
                  {page.bannerImage ? (
                    <NextImage src={page.bannerImage} alt="Feature" fill className="object-contain p-4" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><Zap size={80}/></div>
                  )}
               </div>
               <div className="w-full md:w-1/2 text-left space-y-4">
                  <h2 className="text-green-800 text-xl md:text-3xl font-black uppercase leading-none">কেন আপনি আমাদের {isProduct ? 'পণ্যটি' : 'সার্ভিসটি'} নেবেন?</h2>
                  <ul className="space-y-3">
                    {(page.whyItems?.length ? page.whyItems : ['গুণগত মান নিশ্চিত', 'সাশ্রয়ী মূল্য', 'দ্রুত ডেলিভারি', 'নিরাপদ সেবা', '২৪/৭ কাস্টমার সাপোর্ট']).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 font-bold text-sm md:text-base">
                        <div className="p-1 bg-green-100 text-green-600 rounded-full mt-0.5"><CheckCircle2 size={16} strokeWidth={3}/></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </div>

            <div className="pt-6">
               <button 
                onClick={scrollToForm}
                className="w-full sm:w-auto h-16 md:h-20 px-16 rounded-xl bg-green-800 hover:bg-green-900 text-white font-black text-2xl md:text-3xl uppercase shadow-2xl transition-all active:scale-95 border-b-8 border-green-950"
               >
                 অর্ডার করুন
               </button>
            </div>
          </div>
        </section>

        {/* 🏢 WHY US GRID SECTION */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-5xl space-y-12">
            <div className="bg-green-700 text-white py-3 px-8 rounded-full w-fit mx-auto shadow-xl">
               <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">আমাদের থেকে কেন কিনবেন?</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {(page.features?.length ? page.features : Array(6).fill({ title: 'সেরা মান', description: 'আমরা দিচ্ছি সেরা গুণগত মানের নিশ্চয়তা।' })).map((f: any, i: number) => (
                <div key={i} className="bg-gray-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-gray-100 flex flex-col items-center text-center gap-4 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform">
                    <Star size={32} fill="currentColor" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black uppercase text-sm md:text-base text-gray-900">{f.title}</h4>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
               <Button onClick={scrollToForm} className="h-16 px-12 rounded-xl bg-green-700 hover:bg-green-800 font-black text-xl uppercase tracking-widest shadow-xl shadow-green-700/20">অর্ডার করতে ক্লিক করুন</Button>
            </div>
          </div>
        </section>

        {/* 📖 DETAILS SECTION */}
        <section className="py-16 md:py-24 bg-gray-50 border-y border-gray-100">
           <div className="container mx-auto px-4 max-w-4xl space-y-8">
              <div className="bg-green-700 text-white py-3 px-10 rounded-full w-fit mx-auto shadow-xl mb-10">
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">বিস্তারিত</h2>
              </div>
              <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-sm border border-gray-100 prose prose-slate max-w-none">
                 <p className="text-gray-600 font-bold text-center text-lg md:text-xl leading-loose">
                    {page.detailsText || "এখানে আপনার পণ্যের বিস্তারিত বিবরণ থাকবে। গ্রাহক যেন আপনার সার্ভিস বা প্রোডাক্ট সম্পর্কে একটি স্বচ্ছ ধারণা পায়।"}
                 </p>
              </div>
           </div>
        </section>

        {/* 🎬 VIDEO REVIEWS SECTION */}
        <section className="py-16 md:py-24 bg-green-700 text-white">
          <div className="container mx-auto px-4 max-w-5xl space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight">সম্মানিত কাস্টমার রিভিউ আলহামদুলিল্লাহ</h2>
              <p className="text-white/60 font-bold uppercase tracking-widest text-[10px] md:text-sm">হাজার হাজার কাস্টমার আমাদের সেবায় খুশি</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video relative rounded-2xl overflow-hidden bg-black/20 border-4 border-white/10 group cursor-pointer shadow-2xl">
                  <NextImage src={`https://picsum.photos/seed/review${i}/400/225`} alt="Review" fill className="object-cover opacity-80 group-hover:scale-110 transition-all duration-700" unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="p-3 bg-red-600 rounded-full shadow-2xl group-hover:scale-125 transition-transform"><Play fill="white" size={24} /></div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/40 backdrop-blur-md p-2 rounded-lg">
                    <p className="text-[10px] font-black uppercase truncate">সম্মানিত কাস্টমার রিভিউ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 💰 PRICING SECTION */}
        <section className="py-16 md:py-24 bg-white">
           <div className="container mx-auto px-4 max-w-xl text-center space-y-6">
              <div className="bg-gray-50 border-2 border-gray-100 p-10 rounded-[3rem] shadow-sm space-y-4">
                 <h2 className="text-4xl font-black text-gray-800 uppercase">মূল্য</h2>
                 <div className="space-y-1">
                    <p className="text-xl font-bold text-gray-400 line-through">রেগুলার মূল্য ৳{((calculations.total || 1000) * 1.2).toFixed(0)}</p>
                    <p className="text-5xl font-black text-green-700 tracking-tighter">অফার মূল্য ৳{calculations.total.toFixed(0)}</p>
                 </div>
                 <p className="text-red-600 font-black text-xl md:text-2xl uppercase tracking-widest pt-4">ডেলিভারি চার্জ সম্পূর্ণ ফ্রি</p>
              </div>
           </div>
        </section>

        {/* 📝 ORDER FORM SECTION */}
        <section id="booking-form-start" className="py-16 md:py-32 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-green-700 text-white py-5 px-10 rounded-t-[3rem] shadow-xl text-center border-b-4 border-green-800">
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">অর্ডার করতে সঠিক তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন</h2>
            </div>

            <div className="bg-white p-6 md:p-16 rounded-b-[3rem] shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start border-x-4 border-b-4 border-green-700">
              
              {/* Billing Details */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#081621] flex items-center gap-2 border-b pb-2"><User size={18} className="text-green-700" /> Billing details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">নাম লিখুন *</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Md. Tanzim" className="h-14 bg-gray-50 border-gray-200 rounded-xl font-bold text-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">সম্পূর্ণ ঠিকানা লিখুন *</Label>
                      <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="বাসা, রোড, এলাকা, জেলা" className="min-h-[120px] bg-gray-50 border-gray-200 rounded-xl font-bold p-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">ফোন নাম্বার লিখুন *</Label>
                      <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-14 bg-gray-50 border-gray-200 rounded-xl font-bold text-lg" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#081621] border-b pb-2">Your Products</h3>
                   <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-black text-[9px] uppercase">Product</TableHead>
                            <TableHead className="font-black text-[9px] uppercase text-center">Quantity</TableHead>
                            <TableHead className="font-black text-[9px] uppercase text-right pr-6">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-white">
                            <TableCell className="font-bold text-xs uppercase text-gray-700">{mainProduct?.name || page.title}</TableCell>
                            <TableCell className="text-center">
                               <div className="flex items-center justify-center gap-3">
                                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black">-</button>
                                  <span className="font-black text-sm">{quantity}</span>
                                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black">+</button>
                               </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 font-black text-gray-900">৳{calculations.subtotal}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                   </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] border-b border-gray-200 pb-3">Your order</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tighter">
                      <div className="flex items-center gap-3">
                         <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-white shrink-0">
                            {mainProduct?.imageUrl && <NextImage src={mainProduct.imageUrl} alt="P" fill className="object-contain p-1" unoptimized />}
                         </div>
                         <span>{mainProduct?.name || page.title} × {quantity}</span>
                      </div>
                      <span className="text-gray-900">৳{calculations.subtotal}</span>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                       <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                          <span>Subtotal</span>
                          <span className="text-gray-900">৳{calculations.subtotal}</span>
                       </div>
                       <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                          <span>Shipping</span>
                          <span className="text-green-600">Free</span>
                       </div>
                    </div>

                    <div className="pt-6 border-t-2 border-dashed border-gray-300 flex justify-between items-end">
                       <span className="text-lg font-black uppercase text-[#081621]">Total</span>
                       <span className="text-3xl font-black text-green-700 tracking-tighter">৳{calculations.total}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                     <div className="p-4 bg-white rounded-2xl border border-gray-200 text-[10px] font-bold text-gray-500 space-y-2 uppercase shadow-sm">
                        <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /> Cash on delivery</p>
                        <p className="bg-gray-50 p-3 rounded-lg text-[9px] lowercase font-medium">Pay with cash upon delivery.</p>
                     </div>
                     <p className="text-[9px] text-gray-400 leading-relaxed italic">Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.</p>
                     <Button 
                      onClick={handleOrder} 
                      disabled={isSubmitting}
                      className="w-full h-16 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-xl uppercase tracking-tighter shadow-2xl gap-3 active:scale-95 transition-all"
                     >
                       {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24} /> PLACE ORDER ৳{calculations.total}</>}
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏁 FINAL FOOTER BRANDING */}
        <footer className="py-12 bg-[#081621] text-white/40 text-center">
           <div className="container mx-auto px-4 max-w-4xl space-y-6">
              <div className="flex items-center justify-center gap-3 opacity-60">
                 <Zap size={24} className="text-primary" />
                 <span className="text-xl font-black text-white uppercase tracking-tighter">Smart<span className="text-primary">Clean</span></span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Official High-Conversion Funnel Engine</p>
              <div className="pt-6 border-t border-white/5 flex flex-wrap justify-center gap-6">
                 <span className="text-[9px] font-bold uppercase">Privacy Policy</span>
                 <span className="text-[9px] font-bold uppercase">Terms of Service</span>
                 <span className="text-[9px] font-bold uppercase">Contact Support</span>
              </div>
           </div>
        </footer>

      </div>
    </PublicLayout>
  );
}
