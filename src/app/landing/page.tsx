'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  Command,
  Layers,
  Wrench,
  Bot,
  Users,
  Star,
  Sparkles,
  LineChart,
  Shield,
  Target,
  BadgeCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * 🛡️ STRATEGICALLY ISOLATED SAAS LANDING PAGE
 * This page is 100% independent of the main website's layout/components.
 * It uses zero imports from src/components/layout.
 */
export default function IsolatedLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-indigo-600 selection:text-white antialiased overflow-x-hidden">
      
      {/* 🌌 AMBIENT VISUAL ENGINE */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-50/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/30 blur-[100px]" />
      </div>

      {/* 🚀 ISOLATED ATOMIC NAVBAR */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[500] transition-all duration-500",
        isScrolled ? "bg-white/70 backdrop-blur-2xl py-4 border-b border-slate-100 shadow-sm" : "bg-transparent py-8"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 transition-transform duration-500 group-hover:rotate-12">
              <Command size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase text-slate-900 leading-none">
                Smart<span className="text-indigo-600">Clean</span>
              </span>
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Enterprise OS</span>
            </div>
          </div>

          {/* Minimal Desktop Actions */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Client Access</Link>
            <Button asChild className="rounded-full px-8 h-11 bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 border-none">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 space-y-6 shadow-2xl animate-in slide-in-from-top-4">
             <Link href="/login" className="block text-center font-black uppercase text-xs text-slate-400">Client Access</Link>
             <Button asChild className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest">
               <Link href="/signup">Get Started</Link>
             </Button>
          </div>
        )}
      </nav>

      {/* 🎯 HERO: THE VALUE PROP */}
      <section className="relative pt-40 pb-20 md:pt-56 md:pb-40 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] mb-10 shadow-sm">
                <Sparkles size={12} className="mr-2 inline" /> Intelligent Service Management
              </Badge>
              <h1 className="text-5xl md:text-[90px] font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic">
                Automate your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600">Operations.</span>
              </h1>
            </div>
            
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              Stop juggling spreadsheets. Deploy a unified platform for AI dispatching, real-time B2B ledgers, and automated field workforce tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 group transition-all hover:scale-105 active:scale-95 border-none">
                <Link href="/signup" className="flex items-center gap-4">
                  Provision Your Workspace <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Book a Live Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🧩 BENTO CORE PROTOCOLS */}
      <section className="py-32 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl mb-20 space-y-4">
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">System Protocols</h2>
             <p className="text-slate-500 font-medium">Engineered for service businesses scaling from $1M to $100M.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <div className="h-full rounded-[3rem] bg-white border border-slate-200 p-10 md:p-16 space-y-8 shadow-sm group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit shadow-sm"><Bot size={32} /></div>
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic">AI Dispatch Logic</h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg">Autonomous scheduling engine that optimizes routes and team assignments based on real-time traffic and skill density.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="h-full rounded-[3rem] bg-[#081621] text-white p-10 space-y-8 group hover:shadow-2xl transition-all duration-500">
                <div className="p-4 bg-white/5 rounded-2xl w-fit border border-white/10"><LineChart size={32} className="text-indigo-400" /></div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Unified Audit</h3>
                  <p className="text-white/40 font-medium text-sm leading-relaxed">Real-time financial transparency for B2B partners, vendors, and internal projects in one ledger.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="h-full rounded-[3rem] bg-indigo-600 text-white p-10 space-y-8 group hover:shadow-2xl transition-all duration-500">
                <div className="p-4 bg-white/10 rounded-2xl w-fit border border-white/10"><Smartphone size={32} /></div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Fleet Control</h3>
                  <p className="text-white/60 font-medium text-sm leading-relaxed">Live GPS tracking and digital work-proof capture for 100% accountability in the field.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="h-full rounded-[3rem] bg-white border border-slate-200 p-10 md:p-16 space-y-8 shadow-sm group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500">
                <div className="p-4 bg-slate-900 text-white rounded-2xl w-fit"><ShieldCheck size={32} /></div>
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic">Enterprise Shield</h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg">Bank-grade encryption for PII data and automated Meta CAPI integration for high-performance marketing tracking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 REAL-TIME KPIs */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Platform Volume', val: '$8.5M+' },
              { label: 'Active Field Techs', val: '4,200+' },
              { label: 'Booking Uptime', val: '99.99%' },
              { label: 'Countries', val: '12' }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <p className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 italic">{stat.val}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CALL TO ACTION */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-950 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-150"><Zap size={200} fill="white" /></div>
            <div className="relative z-10 space-y-10">
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">Scale <br />Without Limits.</h2>
              <p className="text-white/40 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">Join the world's most efficient service networks. Get started with SmartClean OS today.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-sm uppercase tracking-widest shadow-xl border-none">
                  <Link href="/signup">Provision Workspace</Link>
                </Button>
                <Link href="/login" className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">Login to Portal</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 ISOLATED FOOTER */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
            <span className="font-black text-lg tracking-tighter uppercase">SmartClean <span className="text-indigo-600">OS</span></span>
          </div>
          
          <div className="flex gap-10">
            {['Changelog', 'Status', 'Security', 'Legal'].map(link => (
              <button key={link} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">{link}</button>
            ))}
          </div>

          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Proto-SaaS. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
