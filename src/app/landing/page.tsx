
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  Activity,
  ChevronRight,
  Command,
  Layers,
  Wrench,
  Clock,
  Layout,
  BarChart3,
  Bot,
  Users,
  Star,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Premium SaaS Landing Page UI
 * Completely independent from the main site layout.
 */
export default function PremiumSaaSLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-indigo-600 selection:text-white antialiased">
      
      {/* 🔮 BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[100px]" />
      </div>

      {/* 🚀 INDEPENDENT NAVBAR */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[200] transition-all duration-300 border-b",
        isScrolled ? "bg-white/70 backdrop-blur-xl py-4 border-slate-200/60 shadow-sm" : "bg-transparent py-6 border-transparent"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
          <Link href="/landing" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-transform group-hover:rotate-6">
              <Command size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-slate-900">
              Smart<span className="text-indigo-600">Clean</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Intelligence', 'Pricing', 'API'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-[11px] font-bold uppercase tracking-widest text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">
              Login
            </Link>
            <Button asChild className="rounded-full px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[9px] tracking-widest shadow-xl shadow-indigo-100">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
             {['Features', 'Intelligence', 'Pricing', 'API'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="block text-sm font-bold uppercase text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </Link>
            ))}
            <Link href="/login" className="block text-sm font-bold uppercase text-indigo-600">Login</Link>
          </div>
        )}
      </nav>

      {/* 🎯 HERO: SaaS VIBE */}
      <section className="relative pt-40 pb-20 md:pt-60 md:pb-40">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.2em] mb-8">
                v2.0: The Intelligence Update is here
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">
                Modern CRM for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Service Elite.</span>
              </h1>
            </div>
            
            <p className="text-slate-500 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Stop managing your cleaning business with spreadsheets. Deploy the infrastructure designed for growth, scaling, and automation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 group">
                <Link href="/signup" className="flex items-center gap-3">
                  Get Started for Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="ghost" asChild className="h-16 px-12 rounded-2xl text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                <Link href="/demo">Book Demo</Link>
              </Button>
            </div>

            {/* Dashboard Mockup / Floating Cards */}
            <div className="relative pt-20 mt-10 animate-in fade-in zoom-in-95 duration-1000 delay-500">
              <div className="relative mx-auto max-w-5xl rounded-[2.5rem] bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden aspect-video flex items-center justify-center p-4">
                 <div className="w-full h-full bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col">
                    <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-400" />
                       <div className="w-3 h-3 rounded-full bg-amber-400" />
                       <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 p-8 grid grid-cols-12 gap-6">
                       <div className="col-span-3 space-y-4">
                          <div className="h-8 bg-indigo-100 rounded-lg w-full" />
                          <div className="h-8 bg-slate-200 rounded-lg w-[80%]" />
                          <div className="h-8 bg-slate-200 rounded-lg w-[90%]" />
                       </div>
                       <div className="col-span-9 grid grid-cols-3 gap-6">
                          <div className="h-32 bg-white rounded-2xl border shadow-sm" />
                          <div className="h-32 bg-white rounded-2xl border shadow-sm" />
                          <div className="h-32 bg-white rounded-2xl border shadow-sm" />
                          <div className="col-span-3 h-48 bg-white rounded-2xl border shadow-sm" />
                       </div>
                    </div>
                 </div>
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -left-10 bottom-20 hidden lg:block animate-bounce duration-[5s]">
                 <Card className="rounded-3xl border-none shadow-2xl p-6 bg-white flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24}/></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-gray-400">Revenue Growth</p>
                       <p className="text-xl font-black">+42.5%</p>
                    </div>
                 </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ BENTO GRID FEATURES */}
      <section id="features" className="py-32 bg-slate-50/50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase">Everything you need. <br /><span className="text-slate-300">Nothing you don't.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[350px]">
            <Card className="md:col-span-8 rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Automation Engine</h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-md">Automate dispatch, invoicing, and customer follow-ups. Save 15+ hours every week on repetitive admin tasks.</p>
                <div className="mt-auto pt-6 flex gap-4 overflow-hidden">
                   <div className="h-20 bg-slate-50 border rounded-2xl w-32 shrink-0 animate-pulse" />
                   <div className="h-20 bg-slate-50 border rounded-2xl w-32 shrink-0 animate-pulse delay-75" />
                   <div className="h-20 bg-slate-50 border rounded-2xl w-32 shrink-0 animate-pulse delay-150" />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-4 rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-indigo-600 text-white group hover:shadow-xl transition-all">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="p-4 bg-white/10 rounded-2xl w-fit mb-8 group-hover:rotate-12 transition-transform">
                  <BarChart3 size={32} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Real-time <br />Analytics</h3>
                <p className="text-white/60 font-medium leading-relaxed text-sm">Visualize your growth with dynamic dashboards. Track revenue, technician efficiency, and customer LTV instantly.</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-4 rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-[#081621] text-white group hover:shadow-xl transition-all">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="p-4 bg-white/5 rounded-2xl w-fit mb-8">
                  <Bot size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">AI Service Agents</h3>
                <p className="text-white/40 font-medium leading-relaxed text-sm">Let our AI handle bookings via WhatsApp and Messenger. Convert leads while you sleep.</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-8 rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-10 flex flex-col h-full md:flex-row items-center gap-10">
                <div className="flex-1 space-y-6">
                   <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                     <ShieldCheck size={32} />
                   </div>
                   <h3 className="text-3xl font-black uppercase tracking-tight">Enterprise Trust</h3>
                   <p className="text-slate-500 font-medium leading-relaxed">Multi-level access control, full financial audit logs, and secure data encryption. Your business data is ironclad.</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200">
                   <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-200 rounded-full w-full" />)}
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 💎 PRICING: MINIMALIST */}
      <section id="pricing" className="py-32 container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-24 space-y-6">
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-none">Global <br /><span className="text-slate-300">Scalability.</span></h2>
          <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Simple. Honest. Powerful.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {[
            { name: "Starter", price: "৳0", desc: "For new companies getting started.", features: ["Up to 5 Techs", "Basic CRM", "Standard Invoicing", "Manual Booking"] },
            { name: "Scale", price: "৳2,500", desc: "The standard for growing teams.", featured: true, features: ["Unlimited Techs", "AI Booking Bot", "Finance Ledger", "Inventory Control", "Customer Portal"] },
            { name: "Global", price: "Custom", desc: "For large agencies and franchises.", features: ["Multi-City Routing", "White Label Portal", "API Access", "Priority 24/7 Support", "Dedicated Account Manager"] }
          ].map((plan, i) => (
            <div key={i} className={cn(
              "p-12 rounded-[3.5rem] flex flex-col h-full transition-all duration-700 border",
              plan.featured ? "bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-indigo-100 ring-2 ring-indigo-600 ring-offset-0 scale-105 z-10" : "bg-transparent border-slate-100 hover:bg-white hover:shadow-2xl"
            )}>
              <div className="space-y-12 flex-1">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{plan.name}</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Month</span>
                </div>
                <ul className="space-y-5 pt-10 border-t border-slate-50">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild className={cn(
                "w-full h-16 rounded-3xl font-black uppercase text-[11px] tracking-widest mt-16 transition-all active:scale-95",
                plan.featured ? "bg-indigo-600 text-white shadow-2xl" : "bg-white text-slate-900 border border-slate-200"
              )}>
                <Link href="/signup">Select Strategy</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* 🏁 CTA & FOOTER */}
      <section className="py-40 bg-slate-900 text-white rounded-[4rem] md:rounded-[6rem] mx-4 md:mx-10 mb-20 shadow-2xl relative overflow-hidden text-center">
        <div className="container mx-auto px-6 max-w-4xl space-y-12">
           <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8]">Build your <br /><span className="text-slate-700">Empire.</span></h2>
           <p className="text-slate-400 text-lg md:text-2xl max-w-xl mx-auto font-medium">Join 500+ cleaning companies growing with Smart Clean.</p>
           <Button asChild size="lg" className="h-20 px-16 rounded-[2rem] bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
              <Link href="/signup">Get Started for Free</Link>
           </Button>
        </div>
      </section>

      <footer className="py-24 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 items-start mb-32">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg">S</div>
                <span className="font-black text-lg tracking-tighter uppercase">SmartClean</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                Professional CRM infrastructure <br /> for the service economy.
              </p>
            </div>
            
            {[
              { t: 'Product', links: ['Features', 'Intelligence', 'Security'] },
              { t: 'Company', links: ['About', 'Careers', 'Brand'] },
              { t: 'Support', links: ['Documentation', 'API', 'System Status'] }
            ].map((group) => (
              <div key={group.t} className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">{group.t}</h4>
                <ul className="space-y-4">
                  {group.links.map(l => (
                    <li key={l}><Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-16 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Smart Clean CRM. All rights reserved.</p>
            <div className="flex gap-12">
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <Link key={s} href="#" className="text-[10px] font-black text-slate-300 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 16 8.5 11 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
