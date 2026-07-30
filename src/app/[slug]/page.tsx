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
  Award,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  const calculations = useMemo(() => {
    if (!page) return { subtotal: 0, discount: 0, total: 0 };
    // 🛡️ Resolve base price from associated items or defaults
    const basePrice = page.basePrice || (page.type === 'product' ? 1200 : 3500); 
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
      toast({ variant: "destructive", title: "Information Required", description: "Please fill all required fields." });
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
      toast({ title: "Success!", description: "Your request has been received." });
      router.push(`/order-success?id=success&type=${page.type}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const contactPhone = settings?.contactPhone || '01919640422';
    const text = `Hi, I am interested in ${page?.title}.`;
    window.open(`https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center font-black uppercase text-gray-200 tracking-[0.5em]">Offline Protocol</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 antialiased overflow-x-hidden pb-32">
      
      {/* 🔴 URGENCY TOP BAR */}
      <div className="bg-[#D60000] text-white py-3 px-4 sticky top-0 z-[500] shadow-xl border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white p-1 shadow-md shrink-0">
              {settings?.logoUrl ? (
                <NextImage src={settings.logoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <div className="w-full h-full bg-emerald-600 rounded flex items-center justify-center text-white font-black text-sm">S</div>
              )}
            </div>
            <div className="flex flex-col relative px-1">
              <div className="flex items-baseline font-black italic text-lg md:text-2xl tracking-tighter leading-none">
                <span className="text-white">Smart</span>
                <span className="text-emerald-400 ml-0.5">Clean</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <Button className="bg-white text-[#D60000] hover:bg-gray-100 rounded-full h-8 px-6 font-black uppercase text-[10px] animate-bounce shrink-0 border-none">
              Special Offer Active 👉
            </Button>
            <div className="flex items-center gap-3">
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.h.toString().padStart(2, '0')}</div>
               </div>
               <span className="text-white/40">:</span>
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.m.toString().padStart(2, '0')}</div>
               </div>
               <span className="text-white/40">:</span>
               <div className="flex gap-1.5 text-center items-center">
                 <div className="bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{timeLeft.s.toString().padStart(2, '0')}</div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <Phone size={12} fill="currentColor" />
            <span className="text-[10px] md:text-sm font-black">{settings?.contactPhone || '01919640422'}</span>
          </div>
        </div>
      </div>

      {/* 🎯 HERO SECTION */}
      <section className="bg-emerald-600 text-white pt-16 pb-12 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl text-center space-y-8 relative z-10">
          <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight italic drop-shadow-2xl">
            {page.heroTitle || page.title}
          </h1>
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video md:aspect-[21/9] rounded-[2rem] md:rounded-[3rem] overflow-hidden border-8 border-white/20 shadow-2xl group">
              {page.bannerImage ? (
                <NextImage src={page.bannerImage} alt="Banner" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-emerald-200"><Zap size={120}/></div>
              )}
            </div>
          </div>
          <Button 
            onClick={() => document.getElementById('order-terminal')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-16 md:h-20 px-12 md:px-20 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black uppercase text-xl md:text-3xl shadow-2xl border-b-8 border-green-800 active:border-b-0 active:translate-y-2 transition-all gap-4"
          >
            Claim Offer Now <ArrowRight size={32} />
          </Button>
        </div>
      </section>

      {/* 📝 ORDER TERMINAL */}
      <section id="order-terminal" className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-emerald-600 rounded-t-[3rem] p-6 text-center shadow-lg border-b-2 border-emerald-500">
             <h2 className="text-white font-black text-sm md:text-xl uppercase tracking-widest">Complete the form below</h2>
          </div>
          
          <div className="bg-white rounded-b-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleOrder} className="flex flex-col lg:flex-row">
               <div className="lg:w-7/12 p-8 md:p-12 space-y-10 border-r border-gray-100">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><User size={14} className="text-primary"/> Billing Details</h4>
                    <div className="space-y-4">
                      <Input name="name" placeholder="Full Name" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" required />
                      <Input name="phone" placeholder="Phone Number" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" required />
                      <Textarea name="address" placeholder="Address" className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4 font-medium shadow-inner" required />
                    </div>
                  </div>
               </div>

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
                       <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</span>
                           <span className="text-4xl font-black text-emerald-600 tracking-tighter">৳{calculations.total.toLocaleString()}</span>
                         </div>
                       </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-tight shadow-xl shadow-green-600/30 gap-3 active:scale-95 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20} /> Confirm Order</>}
                  </Button>
               </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
