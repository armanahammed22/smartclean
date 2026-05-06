
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  Activity,
  Star,
  ChevronRight,
  Command,
  Droplets,
  Sparkles,
  Shield,
  Layers,
  Wrench,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

export default function ServiceLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans text-slate-900 selection:bg-slate-900 selection:text-white antialiased scroll-smooth">
      
      {/* 🚀 MINIMALIST NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-[200] border-b border-slate-200/40 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Command size={22} />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-slate-900">
              Smart<span className="text-slate-400">Clean</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Residential', 'Corporate', 'Deep Clean', 'Support'].map((item) => (
              <Link key={item} href="/services" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Log In
            </Link>
            <Button asChild className="rounded-full px-6 h-10 bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-[9px] tracking-widest shadow-xl shadow-slate-200/50">
              <Link href="/services">Book a Team</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-40 pb-24 md:pt-64 md:pb-48 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Badge className="bg-white text-slate-500 border border-slate-200/60 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-sm mb-10">
                Premium Maintenance Solutions
              </Badge>
              <h1 className="text-6xl md:text-[120px] font-black text-slate-900 leading-[0.8] tracking-tighter uppercase">
                Professional <br />
                <span className="text-slate-300">Purity.</span>
              </h1>
            </div>
            
            <p className="text-slate-500 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              We deploy elite maintenance teams armed with hospital-grade technology to transform your space into a pristine sanctuary.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button asChild size="lg" className="h-16 px-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-300/50 group">
                <Link href="/services" className="flex items-center gap-4">
                  Schedule Deployment <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Link href="/page/about-us" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 flex items-center gap-2">
                Explore Our Protocols <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Decorative Grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
      </section>

      {/* 📊 PLATFORM PERFORMANCE */}
      <section className="py-24 border-y border-slate-200/40 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
              { label: 'Active Personnel', val: '500+' },
              { label: 'Verified Satisfaction', val: '99.2%' },
              { label: 'Service Units Deploy', val: '45k+' },
              { label: 'Response Latency', val: '30 min' }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 group">
                <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter transition-transform group-hover:scale-105 duration-500">{stat.val}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💎 CORE SERVICE ATTRIBUTES */}
      <section className="py-32 md:py-56">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10">
            <div className="max-w-2xl space-y-6">
              <h2 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85]">
                Systematic <br /><span className="text-slate-300">Sterility.</span>
              </h2>
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] pb-3 border-b border-slate-200">Capabilities_01</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Droplets, title: "Nano-Sanitization", desc: "Our microbial fogging covers surfaces with long-lasting antimicrobial protection." },
              { icon: ShieldCheck, title: "Background Verified", desc: "Every service professional undergoes a rigorous 3-layer identity and police verification." },
              { icon: Sparkles, title: "Precision Gear", desc: "We exclusively use industrial-grade HEPA vacuums and specialized steam cleaners." },
              { icon: Smartphone, title: "Smart Scheduling", desc: "Book, track, and pay through our seamless digital infrastructure. Total control in your pocket." },
              { icon: Award, title: "Quality Guarantee", desc: "If you aren't completely satisfied, we re-clean within 24 hours at zero additional cost." },
              { icon: Clock, title: "Swift Dispatch", desc: "Our dynamic routing engine ensures the nearest team is dispatched to your location instantly." }
            ].map((f, i) => (
              <div key={i} className="group p-10 bg-white rounded-[3rem] transition-all duration-700 hover:shadow-2xl hover:shadow-slate-200/60 border border-transparent hover:border-slate-100 flex flex-col gap-10">
                <div className="p-5 rounded-2xl w-fit bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                  <f.icon size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{f.title}</h3>
                  <p className="text-slate-500 font-medium text-sm md:text-base leading-loose">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ SOCIAL VALIDATION */}
      <section className="py-40 bg-slate-900 text-white rounded-[4rem] md:rounded-[6rem] mx-4 md:mx-10 mb-40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none scale-150">
          <Sparkles size={400} />
        </div>
        
        <div className="container mx-auto px-6 max-w-7xl text-center space-y-32">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8]">Loved by the <br /><span className="text-slate-700">Meticulous.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { name: "Tahmid Hasan", text: "The attention to detail is borderline surgical. They didn't just clean, they restored my apartment.", role: "Architect, Studio IX" },
              { name: "Maliha Chowdhury", text: "Smart Clean is the first company in Dhaka that actually respects schedules and timelines. Highly professional.", role: "Marketing Director" },
              { name: "Siam Rahman", text: "Exceptional use of technology. Tracking my team in real-time gave me peace of mind. Worth every Taka.", role: "Tech Entrepreneur" }
            ].map((rev, i) => (
              <div key={i} className="space-y-10">
                <div className="flex justify-center text-slate-700 gap-1.5">
                  {[1,2,3,4,5].map(j => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-xl md:text-2xl font-medium italic leading-relaxed text-slate-300">"{rev.text}"</p>
                <div className="space-y-2">
                  <p className="font-black uppercase text-sm tracking-[0.2em] text-white">{rev.name}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{rev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 TRANSPARENT PRICING */}
      <section className="py-32 container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-32 space-y-6">
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter">Value <span className="text-slate-300">Redefined.</span></h2>
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Zero hidden fees. Global standards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
          {[
            { name: "Express", price: "৳1,500", desc: "Perfect for routine maintenance or single-room focus.", features: ["2 Professional Technicians", "Eco-Friendly Chemicals", "90 Min Session", "Standard Equipment"] },
            { name: "Comprehensive", price: "৳4,500", desc: "Our signature full-apartment restoration service.", featured: true, features: ["4 Senior Pros", "Industrial Vacuuming", "Bathroom Sanitization", "After-Service Warranty"] },
            { name: "Elite", price: "Custom", desc: "Enterprise-grade recurring contracts for businesses.", features: ["Dedicated Supervisor", "Inventory Audit", "Weekly Rotation", "Monthly Compliance Report"] }
          ].map((plan, i) => (
            <div key={i} className={cn(
              "p-12 rounded-[3.5rem] flex flex-col h-full transition-all duration-700 border border-transparent",
              plan.featured ? "bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] ring-2 ring-slate-900 scale-105 z-10" : "bg-transparent hover:bg-white hover:shadow-xl hover:border-slate-100"
            )}>
              <div className="space-y-12 flex-1">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{plan.name}</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ session</span>
                </div>
                <ul className="space-y-5 pt-10 border-t border-slate-100">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild className={cn(
                "w-full h-16 rounded-3xl font-black uppercase text-[11px] tracking-widest mt-16 transition-all active:scale-95",
                plan.featured ? "bg-slate-900 text-white shadow-2xl" : "bg-white text-slate-900 border border-slate-200"
              )}>
                <Link href="/services">Select Plan</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ❓ COMMON QUESTIONS */}
      <section className="py-32 md:py-64 bg-slate-50/50">
        <div className="container mx-auto px-6 max-w-4xl space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter">Clarifications.</h2>
            <div className="w-16 h-1.5 bg-slate-200 mx-auto rounded-full" />
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "How do you verify your professionals?", a: "We conduct 360-degree vetting: background checks, police verification, and a mandatory 100-hour technical training certification at our hub." },
              { q: "Are the chemicals safe for pets?", a: "Exclusively. We use hospital-standard, biodegradable solutions that are lethal to pathogens but completely safe for biological life." },
              { q: "What happens if something breaks?", a: "Every deployment is insured up to ৳50,000. In the rare event of accidental damage, we handle repairs or reimbursement immediately." },
              { q: "Can I cancel at the last minute?", a: "Flexibility is key. Cancellations made 4 hours prior to deployment are completely free. No questions asked." }
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-[2rem] px-10 shadow-sm group">
                <AccordionTrigger className="hover:no-underline py-8">
                  <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-600 group-data-[state=open]:text-slate-900 transition-colors text-left">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 font-medium text-sm md:text-base leading-loose pb-10">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 🏁 MINIMALIST FOOTER */}
      <footer className="py-24 border-t border-slate-200/60 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 items-start mb-32">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg">S</div>
                <span className="font-black text-lg tracking-tighter uppercase">SmartClean</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                Professional hygiene infrastructure <br /> for the modern built environment.
              </p>
            </div>
            
            {[
              { t: 'Protocols', links: ['Residential', 'Commercial', 'Sanitization'] },
              { t: 'Ecosystem', links: ['Join as Pro', 'Careers', 'Affiliate'] },
              { t: 'Compliance', links: ['Privacy', 'Terms', 'Security'] }
            ].map((group) => (
              <div key={group.t} className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">{group.t}</h4>
                <ul className="space-y-4">
                  {group.links.map(l => (
                    <li key={l}><Link href="/services" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-16 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Smart Clean. All rights reserved.</p>
            <div className="flex gap-12">
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <Link key={s} href="#" className="text-[10px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
