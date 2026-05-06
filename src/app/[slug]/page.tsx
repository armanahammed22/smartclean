'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Zap, 
  Star, 
  ArrowRight, 
  CheckCircle2,
  Play,
  Package,
  ShoppingCart,
  User,
  X,
  MapPin,
  Phone,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 11, s: 57 });

  // 1. Fetch Global Settings for Branding
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // 2. Fetch Landing Page Data
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 3. Timer Logic
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const calculations = useMemo(() => {
    if (!page) return { subtotal: 0, discount: 0, total: 0 };
    const basePrice = page.type === 'product' ? 1200 : 3500; 
    const subtotal = basePrice * quantity;
    let discount = page.discountType === 'percent' ? (subtotal * (page.discountValue || 0)) / 100 : (page.discountValue || 0);
    return { subtotal, discount, total: subtotal - discount };
  }, [page, quantity]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if (!name || !phone || !address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "দয়া করে সব ফিল্ড পূরণ করুন।" });
      return;
    }

    setIsSubmitting(true);
    const targetCol = page.type === 'product' ? 'orders' : 'bookings';
    const orderData = {
      customerName: name,
      customerPhone: phone,
      address: address,
      totalPrice: calculations.total,
      status: 'New',
      source: `lp_${slug}`,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, targetCol), orderData);
      toast({ title: "সফল হয়েছে!", description: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।" });
      router.push(`/order-success?id=success&type=${page.type}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center font-black uppercase text-gray-200 tracking-[0.5em]">Offline Protocol</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 antialiased overflow-x-hidden pb-20">
      
      {/* 🔴 URGENCY TOP BAR (Contains Branding) */}
      <div className="bg-[#D60000] text-white py-2 px-4 sticky top-0 z-[500] shadow-xl border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
              {settings?.logoUrl ? (
                <NextImage src={settings.logoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <div className="w-full h-full bg-emerald-600 rounded flex items-center justify-center text-white font-black text-sm">S</div>
              )}
            </div>
            <span className="font-black text-[10px] md:text-sm uppercase tracking-tighter hidden xs:block">
              {settings?.websiteName || 'Smart Clean'}
            </span>
          </div>

          {/* Center: Promo & Timer (Hidden on very small screens to maintain layout) */}
          <div className="hidden sm:flex items-center gap-6">
            <Button className="bg-white text-[#D60000] hover:bg-gray-100 rounded-full h-7 px-4 font-black uppercase text-[9px] animate-bounce shrink-0 shadow-sm border-none">
              অফার প্রাইসে দ্রুত অর্ডার করুন 👉
            </Button>
            <div className="hidden md:flex items-center gap-3">
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.h.toString().padStart(2, '0')}</div>
                 <span className="text-[7px] font-black uppercase opacity-60">HRS</span>
               </div>
               <span className="text-white/40">:</span>
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.m.toString().padStart(2, '0')}</div>
                 <span className="text-[7px] font-black uppercase opacity-60">MINS</span>
               </div>
               <span className="text-white/40">:</span>
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.s.toString().padStart(2, '0')}</div>
                 <span className="text-[7px] font-black uppercase opacity-60">SECS</span>
               </div>
            </div>
          </div>

          {/* Right: Phone */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 group hover:bg-white/20 transition-all cursor-pointer">
            <div className="p-1 bg-white rounded-full text-[#D60000] group-hover:scale-110 transition-transform">
              <Phone size={12} fill="currentColor" />
            </div>
            <span className="text-xs md:text-sm font-black tracking-tight">{settings?.contactPhone || '01919640422'}</span>
          </div>
        </div>
      </div>

      {/* 🎯 HERO SECTION */}
      <section className="bg-emerald-600 text-white pt-16 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="container mx-auto max-w-5xl text-center space-y-8 relative z-10">
          <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight italic drop-shadow-2xl">
            {page.heroTitle || page.title}
          </h1>
          <p className="text-emerald-100 text-sm md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {page.heroSubtitle || "Achieving operational excellence through intelligent sanitization and professional care."}
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video md:aspect-[21/9] rounded-[2rem] md:rounded-[3rem] overflow-hidden border-8 border-white/20 shadow-2xl group">
              {page.bannerImage ? (
                <NextImage src={page.bannerImage} alt="Operation Banner" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-emerald-200"><Zap size={120}/></div>
              )}
            </div>
          </div>

          <Button 
            onClick={() => document.getElementById('order-terminal')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-16 md:h-20 px-12 md:px-20 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black uppercase text-xl md:text-3xl shadow-2xl shadow-green-900/40 border-b-8 border-green-800 active:border-b-0 active:translate-y-2 transition-all gap-4"
          >
            অর্ডার করুন <ArrowRight size={32} />
          </Button>
        </div>
      </section>

      {/* 🧩 WHY CHOOSE US (STARS) */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-emerald-600 rounded-full py-4 px-10 w-fit mx-auto mb-10 shadow-lg">
             <h2 className="text-white font-black text-sm md:text-xl uppercase tracking-widest text-center">আমাদের থেকে কেন সার্ভিস নিবেন?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-none shadow-sm bg-gray-50 rounded-2xl p-6 text-center space-y-4 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0 space-y-4">
                  <div className="flex justify-center text-amber-400 gap-1"><Star size={24} fill="currentColor" /></div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                    ১০০% হাইজিন মেইনটেইন করে প্রফেশনাল টিম দিয়ে আমরা কাজ সম্পন্ন করি।
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 🎥 VIDEO REVIEWS */}
      <section className="py-20 px-4 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="container mx-auto max-w-5xl relative z-10 space-y-12">
          <div className="text-center space-y-3">
             <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight italic">সম্মানিত কাস্টমার রিভিউ আলহামদুলিল্লাহ</h2>
             <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] md:text-sm">হাজার হাজার কাস্টমার সার্ভিস নিয়ে সন্তুষ্ট</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 group cursor-pointer bg-black/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-600 shadow-xl transition-transform group-hover:scale-125">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                   <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-red-600" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 PRICING BLOCK */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-lg">
          <Card className="border-2 border-dashed border-emerald-600 rounded-[3rem] p-8 text-center space-y-6 bg-white shadow-2xl">
             <CardContent className="p-0 space-y-6">
               <h3 className="text-xl font-black uppercase text-red-600 tracking-[0.2em] border-b pb-2">মূল্য</h3>
               <div className="space-y-1">
                 <p className="text-gray-400 font-black text-sm uppercase line-through">রেগুলার মূল্য ৮২৫০৳</p>
                 <div className="flex items-center justify-center gap-2">
                    <p className="text-4xl md:text-6xl font-black text-emerald-600 tracking-tighter italic">৳{calculations.total.toLocaleString()}</p>
                    <Badge className="bg-red-600 text-white border-none font-black text-[10px] h-6">অফার মূল্য</Badge>
                 </div>
               </div>
               <p className="bg-red-50 text-red-600 font-black py-2 rounded-xl text-sm uppercase tracking-widest shadow-inner">ডেলিভারি চার্জ সম্পূর্ণ ফ্রি</p>
             </CardContent>
          </Card>
        </div>
      </section>

      {/* 📝 ORDER TERMINAL */}
      <section id="order-terminal" className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-emerald-600 rounded-t-[3rem] p-6 text-center shadow-lg border-b-2 border-emerald-500">
             <h2 className="text-white font-black text-sm md:text-xl uppercase tracking-widest">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
          </div>
          
          <div className="bg-white rounded-b-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleOrder} className="flex flex-col lg:flex-row">
               
               {/* Left: Intake */}
               <div className="lg:w-7/12 p-8 md:p-12 space-y-10 border-r border-gray-100">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><User size={14} className="text-primary"/> Billing Details</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">নাম লিখুন *</Label>
                        <Input name="name" placeholder="আপনার পূর্ণ নাম" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">মোবাইল নম্বর *</Label>
                        <Input name="phone" placeholder="০১৮XXXXXXXX" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">পূর্ণ ঠিকানা লিখুন *</Label>
                        <Textarea name="address" placeholder="বাসা নং, রোড নং, এলাকা, জেলা" className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4 font-medium shadow-inner" required />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Package size={14} className="text-primary" /> Your Products</h4>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
                       <Table>
                         <TableHeader className="bg-gray-50">
                           <TableRow>
                             <TableHead className="font-black text-[9px] uppercase">Product</TableHead>
                             <TableHead className="font-black text-[9px] uppercase text-center">Quantity</TableHead>
                             <TableHead className="font-black text-[9px] uppercase text-right">Price</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           <TableRow>
                             <TableCell className="py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                                  <span className="text-[11px] font-black uppercase truncate max-w-[120px]">{page.title}</span>
                               </div>
                             </TableCell>
                             <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-1 w-24 mx-auto">
                                   <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-xs font-black">-</button>
                                   <span className="text-xs font-black">{quantity}</span>
                                   <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-xs font-black">+</button>
                                </div>
                             </TableCell>
                             <TableCell className="text-right font-black text-xs text-emerald-600">৳{calculations.subtotal}</TableCell>
                           </TableRow>
                         </TableBody>
                       </Table>
                    </div>
                  </div>
               </div>

               {/* Right: Summary */}
               <div className="lg:w-5/12 p-8 md:p-12 bg-gray-50/50 flex flex-col gap-8 h-full">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#081621] border-b pb-2">Order Summary</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                         <span>Subtotal</span>
                         <span>৳{calculations.subtotal.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-bold text-red-600 uppercase">
                         <span>Savings</span>
                         <span>-৳{calculations.discount.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase">
                         <span>Shipping</span>
                         <span>FREE</span>
                       </div>
                       
                       <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</span>
                           <span className="text-4xl font-black text-emerald-600 tracking-tighter">৳{calculations.total.toLocaleString()}</span>
                         </div>
                         <Badge className="bg-emerald-600 text-white border-none font-black text-[9px] px-3 py-1 rounded-lg">CASH ON DELIVERY</Badge>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8">
                     <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-200 flex items-start gap-3">
                        <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-gray-500 leading-tight uppercase">আপনার তথ্য আমাদের কাছে সম্পূর্ণ নিরাপদ। ডেলিভারি পাওয়ার পর টাকা পরিশোধ করবেন।</p>
                     </div>
                     <Button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-tight shadow-xl shadow-green-600/30 gap-3 active:scale-95 transition-all"
                     >
                       {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20} /> অর্ডার কনফার্ম করুন</>}
                     </Button>
                  </div>
               </div>

            </form>
          </div>
        </div>
      </section>

      {/* 🏁 BRANDED FOOTER */}
      <footer className="py-12 bg-white border-t border-gray-100 px-4 mt-12">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                <MapPin size={14} className="text-emerald-600" /> অফিস ঠিকানা
              </p>
              <p className="text-sm font-bold text-gray-600 max-w-xs leading-relaxed">
                {settings?.address || 'GP.JA-66/2, Wireless Gate, Mohakhali, Dhaka-1212'}
              </p>
            </div>
            
            <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-4 shadow-inner">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                <ShieldCheck size={28} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-emerald-700 leading-none mb-1">Security Verified</p>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">নির্ভরযোগ্য সেবা</p>
              </div>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                <Award size={14} className="text-emerald-600" /> সরকারি লাইসেন্সপ্রাপ্ত
              </p>
              <p className="text-sm font-bold text-gray-600">Smart Clean Bangladesh Ltd.</p>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-50 opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Security Active • SSL Encrypted Checkout</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
