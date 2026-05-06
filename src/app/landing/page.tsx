
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
  X,
  Sparkles,
  MousePointer2,
  Shield,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * COMPLETELY INDEPENDENT PREMIUM SAAS LANDING PAGE
 * This page does not use the main site's PublicLayout or Global Wrappers.
 */
export default function IndependentLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-indigo-600 selection:text-white antialiased overflow-x-hidden">
      
      {/* 🔮 AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-50/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-50/40 blur-[100px]" />
      </div>

      {/* 🚀 MINIMAL INDEPENDENT HEADER */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[200] transition-all duration-500 border-b",
        isScrolled ? "bg-white/70 backdrop-blur-xl py-4 border-slate-200/60 shadow-sm" : "bg-transparent py-8 border-transparent"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 transition-transform duration-500 group-hover:rotate-[15deg]">
              <Command size={22} />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase text-slate-900">
              Smart<span className="text-indigo-600">Clean</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Solutions', 'Technology', 'Impact', 'Enterprise'].map((item) => (
              <button key={item} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors">
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button asChild className="rounded-full px-8 h-12 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
              <Link href="/signup">Get Started</Link>
            </Button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-8 space-y-6 animate-in fade-in slide-in-from-top-4">
             {['Solutions', 'Technology', 'Impact', 'Enterprise'].map((item) => (
              <button key={item} className="block text-sm font-black uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-48 pb-20 md:pt-64 md:pb-40">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] mb-10 shadow-sm">
                Next-Gen Service Management
              </Badge>
              <h1 className="text-6xl md:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic">
                Engineering <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Purity.</span>
              </h1>
            </div>
            
            <p className="text-slate-400 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              Transform your field operations with the most intelligent CRM infrastructure ever built for the cleaning industry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <Button asChild size="lg" className="h-20 px-14 rounded-[2rem] bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 group transition-all hover:scale-105 active:scale-95">
                <Link href="/signup" className="flex items-center gap-4">
                  Request Access <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              <Button variant="ghost" asChild className="h-20 px-14 rounded-[2rem] text-slate-900 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 border border-slate-100">
                <Link href="/demo">Watch Protocol</Link>
              </Button>
            </div>

            {/* Visual Dock */}
            <div className="relative pt-32 animate-in fade-in zoom-in-95 duration-1000 delay-500">
              <div className="mx-auto max-w-5xl rounded-[3rem] bg-white shadow-[0_100px_150px_-50px_rgba(0,0,0,0.15)] border border-slate-100 p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <div className="aspect-[21/9] rounded-[2rem] bg-slate-50 border border-slate-200 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Loader2 className="animate-spin text-indigo-100" size={80} />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔮 BENTO INNOVATION GRID */}
      <section className="py-40 bg-slate-50/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
            <div className="space-y-4 max-w-2xl">
               <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Built for <br />the elite.</h2>
               <p className="text-slate-400 font-medium text-lg">Sophisticated tools for companies that don't settle for "good enough".</p>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-1.5 bg-indigo-600 rounded-full" />
               <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <Card className="h-[450px] rounded-[3.5rem] border-none shadow-sm overflow-hidden bg-white group hover:shadow-2xl transition-all duration-700 relative">
                <CardContent className="p-16 space-y-8 flex flex-col h-full">
                  <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                    <Zap size={32} fill="currentColor" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black uppercase tracking-tight">AI Dispatcher</h3>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-md text-lg">Predictive scheduling that assigns the best technicians based on location, skill-set, and historical performance data.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Core Technology</span>
                     <div className="h-px flex-1 bg-slate-100" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card className="h-[450px] rounded-[3.5rem] border-none shadow-sm overflow-hidden bg-[#081621] text-white group hover:shadow-2xl transition-all duration-700">
                <CardContent className="p-12 flex flex-col h-full text-center items-center justify-center gap-8">
                  <div className="p-5 bg-white/5 rounded-3xl backdrop-blur-md">
                    <BarChart3 size={40} className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Financial <br />Audit</h3>
                    <p className="text-white/40 font-medium text-sm leading-relaxed">Automated ledgers, per-project costing, and real-time revenue leakage alerts.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 FINAL PROTOCOL CTA */}
      <section className="py-40">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-32 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150"><Sparkles size={200} /></div>
            <div className="relative z-10 space-y-12">
               <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8]">Join the <br /><span className="text-slate-700">Empire.</span></h2>
               <p className="text-slate-400 text-lg md:text-2xl max-w-xl mx-auto font-medium">Ready to deploy the standard for service excellence?</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <Button asChild className="h-20 px-16 rounded-[2rem] bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
                    <Link href="/signup">Apply Now</Link>
                 </Button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 MINIMAL FOOTER */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">S</div>
              <span className="font-black text-lg tracking-tighter uppercase">SmartClean</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10">
              {['Terms', 'Security', 'Infrastructure', 'API'].map((l) => (
                <button key={l} className="text-[10px] font-black text-slate-300 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">{l}</button>
              ))}
            </div>

            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© 2026 Proto-SaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
