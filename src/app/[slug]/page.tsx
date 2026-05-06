'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  ShoppingCart, 
  User, 
  Loader2,
  Zap,
  Plus,
  Minus,
  ArrowRight,
  Smartphone,
  Info,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Play,
  Command,
  X,
  Menu,
  MousePointer2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(11, "Valid phone required"),
  address: z.string().min(5, "Address required"),
});

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. Fetch Landing Page Data
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Global Settings for Branding
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const calculations = useMemo(() => {
    if (!page) return { subtotal: 0, discount: 0, total: 0 };
    // Simplified logic for standalone SaaS UI
    const basePrice = page.type === 'product' ? 1000 : 2500; // Fallback
    const subtotal = basePrice * quantity;
    let discount = page.discountType === 'percent' ? (subtotal * (page.discountValue || 0)) / 100 : (page.discountValue || 0);
    return { subtotal, discount, total: subtotal - discount };
  }, [page, quantity]);

  const scrollToForm = () => {
    const el = document.getElementById('order-terminal');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if (!name || !phone || !address) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please fill all fields." });
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
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: targetCol,
        operation: 'create',
        requestResourceData: orderData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center font-black uppercase text-gray-300">Inactive Engine</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-600 selection:text-white antialiased overflow-x-hidden">
      
      {/* 🌌 AMBIENT VISUAL ENGINE */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-50/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/30 blur-[100px]" />
      </div>

      {/* 🚀 ISOLATED PREMIUM NAVBAR */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[500] transition-all duration-500 px-4 md:px-8",
        isScrolled ? "bg-white/70 backdrop-blur-2xl py-4 border-b border-slate-100 shadow-sm" : "bg-transparent py-8"
      )}>
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Command size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase text-slate-900 leading-none">
                {settings?.websiteName || 'Smart Clean'}
              </span>
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-1">Operational Protocol</span>
            </div>
          </div>

          <Button 
            onClick={scrollToForm}
            className="rounded-full px-8 h-11 bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 border-none"
          >
            Deploy Now
          </Button>
        </div>
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 px-6">
        <div className="container mx-auto max-w-7xl text-center space-y-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] mb-4">
              <Zap size={12} className="mr-2 inline" /> Premium Fulfillment Service
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic">
              {page.heroTitle || page.title}
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              {page.heroSubtitle || "Experience world-class operational excellence with our dedicated fulfillment engine."}
            </p>
          </div>

          <div className="relative group max-w-5xl mx-auto">
             <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
             <div className="relative aspect-video md:aspect-[21/9] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
                {page.bannerImage ? (
                  <NextImage src={page.bannerImage} alt="Banner" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Command size={80}/></div>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* 🧩 BENTO FEATURES */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 h-full">
                 <div className="h-full rounded-[3rem] bg-white border border-slate-200 p-10 md:p-16 space-y-6 shadow-sm group hover:shadow-2xl transition-all duration-500">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit shadow-sm"><ShieldCheck size={32} /></div>
                    <h3 className="text-3xl font-black uppercase tracking-tight italic">Guaranteed Precision</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Our protocol ensures 100% adherence to quality standards. Every deployment is monitored by our central logic engine.</p>
                 </div>
              </div>
              <div className="md:col-span-4 h-full">
                 <div className="h-full rounded-[3rem] bg-[#081621] text-white p-10 space-y-6 group hover:shadow-2xl transition-all duration-500">
                    <div className="p-4 bg-white/5 rounded-2xl w-fit border border-white/10"><Clock size={32} className="text-indigo-400" /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Express TAT</h3>
                    <p className="text-white/40 font-medium text-sm leading-relaxed">Swift turnaround times powered by our automated dispatch algorithms. No delays, just results.</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 📝 ORDER TERMINAL */}
      <section id="order-terminal" className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left: Dynamic Pricing & Details */}
            <div className="lg:w-1/2 p-10 md:p-20 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-10">
                <div className="space-y-4">
                  <Badge className="bg-indigo-600 text-white border-none px-4 py-1 rounded-full font-black text-[10px] uppercase">Plan Selection</Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Configure Your <br/>Requirement.</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <span className="font-black uppercase text-xs tracking-widest text-slate-400">Total Quantity</span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-colors">-</button>
                      <span className="text-xl font-black">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-colors">+</button>
                    </div>
                  </div>

                  <div className="p-8 bg-[#081621] rounded-[2.5rem] text-white space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Final Settlement Amount</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter">৳{calculations.total.toLocaleString()}</span>
                      <span className="text-xs font-bold text-white/30 uppercase">BDT</span>
                    </div>
                    <p className="text-[10px] text-white/40 italic">* Inclusive of all system fees and processing taxes.</p>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex items-center gap-4">
                 <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><ShieldCheck className="text-emerald-500" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol v2.0 Active</p>
              </div>
            </div>

            {/* Right: Intake Form */}
            <div className="lg:w-1/2 p-10 md:p-20">
              <div className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">Provision Entry</h3>
                  <p className="text-xs text-slate-400 font-medium">Please provide accurate identification for fulfillment.</p>
                </div>

                <form onSubmit={handleOrder} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Full Legal Name</Label>
                    <Input name="name" placeholder="John Doe" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Secure Contact (Phone)</Label>
                    <Input name="phone" placeholder="01XXXXXXXXX" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Deployment Address</Label>
                    <Textarea name="address" placeholder="House, Road, Block..." className="min-h-[120px] bg-slate-50 border-none rounded-3xl p-6 font-medium shadow-inner focus:bg-white transition-all" required />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 mt-6 transition-all active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Deployment"}
                  </Button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🏁 ISOLATED FOOTER */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
            <span className="font-black text-lg tracking-tighter uppercase">{settings?.websiteName || 'Smart Clean'} <span className="text-indigo-600">Protocol</span></span>
          </div>
          
          <div className="flex gap-8">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Privacy</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Terms</span>
          </div>

          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 {settings?.websiteName}. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

    </div>
  );
}
