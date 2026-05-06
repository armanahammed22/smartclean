'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Zap, 
  Command, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2,
  Wallet,
  Smartphone,
  MapPin,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    // Simulated base rates for a high-end feel
    const basePrice = page.type === 'product' ? 1200 : 3500; 
    const subtotal = basePrice * quantity;
    let discount = page.discountType === 'percent' ? (subtotal * (page.discountValue || 0)) / 100 : (page.discountValue || 0);
    return { subtotal, discount, total: subtotal - discount };
  }, [page, quantity]);

  const scrollToForm = () => {
    const el = document.getElementById('fulfillment-terminal');
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
      toast({ variant: "destructive", title: "Missing Identification", description: "Required fields must be completed for fulfillment." });
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
      toast({ title: "Authorized", description: "Deployment request has been logged." });
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

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!page || !page.active) return <div className="h-screen flex items-center justify-center font-black uppercase text-gray-200 tracking-[0.5em]">Offline Protocol</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary selection:text-white antialiased overflow-x-hidden">
      
      {/* 🌌 AMBIENT VISUAL LAYER */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-indigo-50/50 blur-[150px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/40 blur-[120px]" />
      </div>

      {/* 🚀 ISOLATED PROTOCOL HEADER */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[500] transition-all duration-700 px-6",
        isScrolled ? "bg-white/80 backdrop-blur-3xl py-4 border-b border-slate-100 shadow-sm" : "bg-transparent py-10"
      )}>
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#081621] rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/10">
              <Command size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase leading-none">
                {settings?.websiteName || 'Smart Clean'}
              </span>
              <Badge variant="outline" className="text-[7px] font-black uppercase tracking-[0.3em] text-primary border-primary/20 h-4 px-1.5 mt-1 bg-white/50">Service Engine v2.0</Badge>
            </div>
          </div>

          <Button 
            onClick={scrollToForm}
            className="rounded-full px-8 h-12 bg-[#081621] hover:bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Deploy Protocol
          </Button>
        </div>
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-44 pb-24 md:pt-64 md:pb-40 px-6">
        <div className="container mx-auto max-w-7xl text-center space-y-16">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Badge className="bg-primary/5 text-primary border border-primary/10 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.4em] mb-4 shadow-sm">
              <Zap size={14} className="mr-2 inline fill-current" /> Premium Fulfillment Active
            </Badge>
            <h1 className="text-6xl md:text-9xl font-black text-slate-950 leading-[0.85] tracking-tighter uppercase italic">
              {page.heroTitle || page.title}
            </h1>
            <p className="text-slate-500 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              {page.heroSubtitle || "Achieving operational excellence through intelligent sanitization and professional care."}
            </p>
          </div>

          <div className="relative group max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-300">
             <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000" />
             <div className="relative aspect-video md:aspect-[21/9] rounded-[4rem] overflow-hidden border-8 border-white shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
                {page.bannerImage ? (
                  <NextImage src={page.bannerImage} alt="Operation Banner" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" unoptimized />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Command size={120}/></div>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* 🧩 BENTO CORE FEATURES */}
      <section className="py-32 bg-slate-50/30 border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7 h-full">
                 <div className="h-full rounded-[4rem] bg-white border border-slate-100 p-12 md:p-20 space-y-8 shadow-sm group hover:shadow-3xl transition-all duration-700">
                    <div className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl w-fit shadow-sm"><ShieldCheck size={40} /></div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black uppercase tracking-tight italic text-slate-950">Absolute Precision</h3>
                      <p className="text-slate-500 font-medium text-xl leading-relaxed">Our protocol mandates a 100% adherence to hygiene standards. Every square inch is cross-verified by our logic engine.</p>
                    </div>
                    <div className="flex gap-4">
                       <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 rounded-full font-black text-[9px] uppercase">ISO Certified</Badge>
                       <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-1 rounded-full font-black text-[9px] uppercase">Verified Staff</Badge>
                    </div>
                 </div>
              </div>
              <div className="md:col-span-5 h-full">
                 <div className="h-full rounded-[4rem] bg-[#081621] text-white p-12 md:p-16 space-y-8 shadow-2xl group transition-all duration-700 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-150"><Clock size={200}/></div>
                    <div className="relative z-10 space-y-8">
                      <div className="p-5 bg-white/5 rounded-3xl w-fit border border-white/10 shadow-xl"><Clock size={40} className="text-primary" /></div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black uppercase tracking-tight italic">Rapid Response</h3>
                        <p className="text-white/40 font-medium text-base leading-relaxed">Emergency deployment ready within 4 hours. Automated dispatch logic ensures your site is serviced on priority.</p>
                      </div>
                      <Button variant="ghost" className="p-0 text-primary hover:text-white font-black uppercase text-[10px] tracking-widest gap-2">Explore Timeline <ArrowRight size={14}/></Button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 📝 FULFILLMENT TERMINAL */}
      <section id="fulfillment-terminal" className="py-40 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-[5rem] shadow-[0_50px_150px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left: Financial Config */}
            <div className="lg:w-1/2 p-12 md:p-24 bg-slate-50 flex flex-col justify-between border-r border-slate-100">
              <div className="space-y-12">
                <div className="space-y-4">
                  <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Configuration</Badge>
                  <h2 className="text-5xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Scale Your <br/>Requirement.</h2>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
                    <span className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Resource Load</span>
                    <div className="flex items-center gap-8">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-2xl border-2 border-slate-100 flex items-center justify-center font-black hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90 shadow-sm">-</button>
                      <span className="text-3xl font-black text-slate-950">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-2xl border-2 border-slate-100 flex items-center justify-center font-black hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90 shadow-sm">+</button>
                    </div>
                  </div>

                  <div className="p-10 bg-[#081621] rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Zap size={100} /></div>
                    <div className="space-y-2 relative z-10">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Settlement Total</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-6xl font-black tracking-tighter text-white animate-in fade-in zoom-in-95 duration-500">৳{calculations.total.toLocaleString()}</span>
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">BDT</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">System Fees Included</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-16 flex items-center gap-4">
                 <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-emerald-500"><ShieldCheck size={24} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 leading-none">Security Active</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">End-to-end Encrypted Provisioning</p>
                 </div>
              </div>
            </div>

            {/* Right: Intake Terminal */}
            <div className="lg:w-1/2 p-12 md:p-24 bg-white">
              <div className="space-y-12">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-widest text-slate-950 italic">Provision Entry</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fulfillment registration required</p>
                </div>

                <form onSubmit={handleOrder} className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Full Legal Identity</Label>
                    <Input name="name" placeholder="RECIPIENT NAME" className="h-16 bg-slate-50 border-none rounded-2xl font-black text-sm px-8 shadow-inner focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Communication Port (Phone)</Label>
                    <Input name="phone" placeholder="01XXXXXXXXX" className="h-16 bg-slate-50 border-none rounded-2xl font-black text-sm px-8 shadow-inner focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Deployment Destination</Label>
                    <Textarea name="address" placeholder="EXACT LOCATION DETAILS..." className="min-h-[140px] bg-slate-50 border-none rounded-3xl p-8 font-bold text-sm shadow-inner focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all leading-relaxed" required />
                  </div>
                  
                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-[#15435a] text-white font-black text-lg uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(30,95,122,0.3)] transition-all active:scale-95 group"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <><Zap size={20} className="mr-3 fill-current" /> Authorize Fulfillment</>}
                    </Button>
                  </div>
                </form>

                <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Protocol Execution System © 2026</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🏁 ISOLATED MINIMAL FOOTER */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white font-black">S</div>
            <span className="font-black text-lg tracking-tighter uppercase">{settings?.websiteName || 'Smart Clean'} <span className="text-primary opacity-40">Protocol</span></span>
          </div>
          
          <div className="flex gap-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary cursor-pointer transition-colors">Documentation</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary cursor-pointer transition-colors">Security</span>
          </div>

          <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.5em]">SYSTEM_READY_STABLE_V2</p>
        </div>
      </footer>

    </div>
  );
}
