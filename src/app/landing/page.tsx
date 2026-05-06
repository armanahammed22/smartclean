
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Check, 
  Zap, 
  Shield, 
  Smartphone, 
  Globe, 
  Activity,
  Plus,
  Minus,
  Star,
  ChevronRight,
  Monitor,
  Command
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

export default function StandaloneLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans text-slate-900 selection:bg-slate-900 selection:text-white antialiased">
      
      {/* 🚀 GLASSMORPHISM NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[200] border-b border-slate-200/40 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Command size={20} />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase text-slate-900">
              Smart<span className="text-slate-400">Clean</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Services', 'Platform', 'Pricing', 'Docs'].map((item) => (
              <Link key={item} href="#" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              Log In
            </Link>
            <Button asChild className="rounded-full px-6 h-10 bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-[9px] tracking-widest shadow-xl shadow-slate-200/50">
              <Link href="/services">Start Cleaning</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-40 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Badge className="bg-white text-slate-500 border border-slate-200/60 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-sm mb-6">
                Now Integrated with AI
              </Badge>
              <h1 className="text-6xl md:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase">
                The Future of <br />
                <span className="text-slate-300">Clean is Here.</span>
              </h1>
            </div>
            
            <p className="text-slate-500 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Minimal effort. Maximal purity. Smart Clean reimagines hygiene for the modern era with precision technology.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-300/50 group">
                <Link href="/services" className="flex items-center gap-3">
                  Deploy Professional Team <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Link href="/page/about-us" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 flex items-center gap-2">
                See How it Works <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-[0.03] pointer-events-none">
          <Grid size={800} className="text-slate-900" />
        </div>
      </section>

      {/* 📊 SOCIAL PROOF / STATS */}
      <section className="py-20 border-y border-slate-200/40 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Successful Deployments', val: '40k+' },
              { label: 'Client Retention Rate', val: '98.2%' },
              { label: 'Active Professionals', val: '500+' },
              { label: 'System Uptime', val: '99.9%' }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1 group">
                <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter transition-transform group-hover:scale-105 duration-500">{stat.val}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💎 FEATURES GRID */}
      <section className="py-32 md:py-48">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
                Engineered for <br /><span className="text-slate-300">Excellence.</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest pb-2">01 / Capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Instant Booking", desc: "Automated scheduling system that matches you with the best available professional in 30 seconds." },
              { icon: Shield, title: "Secure Chain", desc: "Every professional is background verified and follows a strict digital security protocol." },
              { icon: Smartphone, title: "Live Updates", desc: "Real-time tracking of your service team from dispatch to completion via our portal." },
              { icon: Globe, title: "Area Coverage", desc: "Our network spans all major zones with local hubs for rapid response times." },
              { icon: Activity, title: "Data Driven", desc: "Using AI to optimize cleaning patterns and ensure resource efficiency at every site." },
              { icon: Star, title: "Premium Quality", desc: "Industrial grade equipment combined with hospital-standard chemical formulations." }
            ].map((f, i) => (
              <Card key={i} className="border-none shadow-none bg-white rounded-[2.5rem] p-10 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700">
                <CardContent className="p-0 space-y-6">
                  <div className="p-4 rounded-2xl w-fit bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    <f.icon size={28} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{f.title}</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ TESTIMONIALS */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden rounded-[3rem] md:rounded-[5rem] mx-4 md:mx-10 mb-32 shadow-2xl">
        <div className="container mx-auto px-6 max-w-7xl text-center space-y-20">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Trusted by the <br /><span className="text-slate-700">Discerning.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: "Adnan Sami", text: "The most precise cleaning service I've ever experienced. Their attention to corner details is remarkable.", role: "CEO, TechVision" },
              { name: "Nabila Khan", text: "Finally, a platform that understands the intersection of technology and hospitality. Pure class.", role: "Creative Director" },
              { name: "Rafat Ahmed", text: "Smart Clean has become an essential part of our office maintenance. Reliability is their core strength.", role: "Operations Lead" }
            ].map((rev, i) => (
              <div key={i} className="space-y-8 p-6">
                <div className="flex justify-center text-slate-700 gap-1">
                  {[1,2,3,4,5].map(j => <Star key={j} size={14} fill="currentColor" className="text-primary" />)}
                </div>
                <p className="text-lg md:text-xl font-medium italic leading-relaxed text-slate-300">"{rev.text}"</p>
                <div className="space-y-1">
                  <p className="font-black uppercase text-xs tracking-widest">{rev.name}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{rev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 PRICING SECTION */}
      <section className="py-32 container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter">Simple <span className="text-slate-300">Pricing.</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No hidden fees. Professional standards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {[
            { name: "Essential", price: "৳1,500", desc: "For single rooms or focused deep cleaning tasks.", features: ["2 Professional Cleaners", "Standard Equipment", "Eco-friendly Solutions", "Live Support"] },
            { name: "Standard", price: "৳4,500", desc: "Our most popular choice for full apartment cleaning.", featured: true, features: ["4 Senior Technicians", "Industrial Vacuuming", "Chemical Sanitization", "After-service Warranty"] },
            { name: "Corporate", price: "Custom", desc: "Tailored recurring solutions for office and factories.", features: ["Dedicated Supervisor", "Shift-based Rotation", "Inventory Management", "Monthly Audit Reports"] }
          ].map((plan, i) => (
            <Card key={i} className={cn(
              "border-none shadow-none bg-white p-10 rounded-[3rem] flex flex-col h-full transition-all duration-500",
              plan.featured ? "ring-2 ring-slate-900 shadow-2xl shadow-slate-200" : "hover:bg-slate-50"
            )}>
              <div className="space-y-8 flex-1">
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/ session</span>
                </div>
                <ul className="space-y-4 pt-6 border-t border-slate-100">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button className={cn(
                "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-12 transition-all active:scale-95",
                plan.featured ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-900 border border-slate-200"
              )}>
                Choose Plan
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ❓ FAQ SECTION */}
      <section className="py-32 md:py-48 bg-slate-50/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Common Questions</h2>
            <div className="w-12 h-1 bg-slate-200 mx-auto rounded-full" />
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "What chemicals do you use?", a: "We exclusively use hospital-standard, biodegradable solutions that are safe for pets and children while being lethal to bacteria and viruses." },
              { q: "How long does a session take?", a: "An Essential session takes about 2 hours, while a full home Deep Clean can take between 4 to 7 hours depending on the total area." },
              { q: "Is insurance included?", a: "Yes, every Smart Clean deployment is insured. Any accidental damage caused by our team is fully covered by our protection plan." },
              { q: "Can I book on short notice?", a: "Absolutely. Our automated matching system can deploy a team in as little as 4 hours for most urban locations." }
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-3xl px-8 shadow-sm group">
                <AccordionTrigger className="hover:no-underline py-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-data-[state=open]:text-slate-900 transition-colors">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 font-medium leading-relaxed pb-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 🏁 CLEAN FOOTER */}
      <footer className="py-20 border-t border-slate-200/60 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
                <span className="font-black text-sm tracking-tighter uppercase">SmartClean</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                Professional hygiene infrastructure <br /> for modern living spaces.
              </p>
            </div>
            
            {[
              { t: 'Product', links: ['Services', 'Add-ons', 'SaaS Platform'] },
              { t: 'Company', links: ['About', 'Careers', 'Contact'] },
              { t: 'Legal', links: ['Privacy', 'Terms', 'Security'] }
            ].map((group) => (
              <div key={group.t} className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">{group.t}</h4>
                <ul className="space-y-3">
                  {group.links.map(l => (
                    <li key={l}><Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Smart Clean. All rights reserved.</p>
            <div className="flex gap-8">
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <Link key={s} href="#" className="text-[9px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
