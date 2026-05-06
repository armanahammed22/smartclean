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
  CreditCard,
  Target,
  LineChart,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

/**
 * COMPLETELY INDEPENDENT PREMIUM SAAS LANDING PAGE
 * This page is detached from the main site's layout.
 * It uses a minimalist, futuristic design language.
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
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900 selection:bg-indigo-600 selection:text-white antialiased overflow-x-hidden">
      
      {/* 🔮 AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[100px]" />
      </div>

      {/* 🚀 INDEPENDENT HEADER */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[200] transition-all duration-500",
        isScrolled ? "bg-white/70 backdrop-blur-xl py-4 border-b border-slate-200/60 shadow-sm" : "bg-transparent py-8"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:rotate-[15deg]">
              <Command size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter uppercase text-slate-900 leading-none">
                Smart<span className="text-indigo-600">Clean</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Enterprise OS</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            {['Technology', 'Solutions', 'Pricing', 'Infrastructure'].map((item) => (
              <button key={item} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors">
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mr-4">Sign In</Link>
            <Button asChild className="rounded-full px-8 h-12 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
              <Link href="/signup">Get Started</Link>
            </Button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-600">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-8 space-y-6 animate-in fade-in slide-in-from-top-4 shadow-2xl">
             {['Technology', 'Solutions', 'Pricing', 'Infrastructure'].map((item) => (
              <button key={item} className="block text-sm font-black uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-60 md:pb-40">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] mb-10 shadow-sm">
                <Sparkles size={12} className="mr-2 inline" /> Intelligent Service Management
              </Badge>
              <h1 className="text-6xl md:text-[110px] font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic">
                Engineering <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 animate-pulse">Purity.</span>
              </h1>
            </div>
            
            <p className="text-slate-500 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              Transform your field operations with the most sophisticated CRM infrastructure ever built for the professional cleaning industry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <Button asChild size="lg" className="h-20 px-14 rounded-[2.5rem] bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 group transition-all hover:scale-105 active:scale-95">
                <Link href="/signup" className="flex items-center gap-4">
                  Request Protocol <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              <Button variant="ghost" asChild className="h-20 px-14 rounded-[2.5rem] text-slate-900 font-black uppercase text-[11px] tracking-widest hover:bg-white border border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                <Link href="/demo">Watch Interface</Link>
              </Button>
            </div>

            {/* Visual Dashboard Teaser */}
            <div className="relative pt-32 animate-in fade-in zoom-in-95 duration-1000 delay-500">
              <div className="mx-auto max-w-5xl rounded-[4rem] bg-white shadow-[0_100px_150px_-50px_rgba(0,0,0,0.12)] border border-slate-100 p-3 md:p-6 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <div className="aspect-[21/9] rounded-[3rem] bg-slate-50 border border-slate-100 overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                       <div className="p-6 bg-white rounded-full shadow-2xl animate-bounce">
                          <Zap size={48} className="text-indigo-600" fill="currentColor" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Initializing OS...</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔮 CORE TECHNOLOGY BENTO GRID */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
            <div className="space-y-4 max-w-2xl">
               <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Built for <br />the elite.</h2>
               <p className="text-slate-400 font-medium text-lg md:text-xl">Sophisticated architecture for companies that demand precision.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <Card className="h-full rounded-[4rem] border-none shadow-sm overflow-hidden bg-slate-50 group hover:shadow-2xl transition-all duration-700 relative">
                <CardContent className="p-12 md:p-20 space-y-8 flex flex-col h-full">
                  <div className="p-5 bg-white text-indigo-600 rounded-3xl w-fit shadow-xl group-hover:scale-110 transition-transform">
                    <Target size={32} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">AI-Driven Dispatch</h3>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-md text-lg">Predictive scheduling that automatically assigns technicians based on live traffic, skill-set, and historical rating data.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-6">
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Core Neural Engine</span>
                     <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card className="h-full rounded-[4rem] border-none shadow-sm overflow-hidden bg-[#081621] text-white group hover:shadow-2xl transition-all duration-700 min-h-[450px]">
                <CardContent className="p-12 flex flex-col h-full text-center items-center justify-center gap-10">
                  <div className="p-6 bg-white/5 rounded-[2.5rem] backdrop-blur-md border border-white/5 shadow-2xl">
                    <LineChart size={48} className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none italic">Financial <br />Audit</h3>
                    <p className="text-white/40 font-medium text-sm leading-relaxed">Automated B2B ledgers, per-project costing, and real-time revenue leakage detection.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card className="h-full rounded-[4rem] border-none shadow-sm overflow-hidden bg-indigo-600 text-white group hover:shadow-2xl transition-all duration-700 min-h-[450px]">
                <CardContent className="p-12 flex flex-col h-full text-center items-center justify-center gap-10">
                  <div className="p-6 bg-white/10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <Smartphone size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none italic">Field <br />Presence</h3>
                    <p className="text-white/60 font-medium text-sm leading-relaxed">Live GPS technician tracking, site check-ins, and digital work proof capture.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-8">
              <Card className="h-full rounded-[4rem] border-none shadow-sm overflow-hidden bg-slate-900 group hover:shadow-2xl transition-all duration-700 relative text-white">
                <CardContent className="p-12 md:p-20 space-y-8 flex flex-col h-full">
                  <div className="p-5 bg-white/10 text-primary rounded-3xl w-fit shadow-xl group-hover:scale-110 transition-transform">
                    <Cpu size={32} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">Scale Architecture</h3>
                    <p className="text-white/40 font-medium leading-relaxed max-w-md text-lg">Built on a multi-tenant infrastructure designed to handle 10,000+ simultaneous bookings without latency.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 💰 TRANSPARENT PRICING */}
      <section className="py-40">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-6 mb-24">
            <Badge variant="outline" className="rounded-full px-6 py-1 font-black text-[9px] uppercase tracking-widest border-slate-200">Investment Tiers</Badge>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Engineered for <span className="text-indigo-600">Growth.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Express', price: '49', desc: 'For growing service teams.', features: ['Up to 10 Staff', 'Basic AI Dispatch', 'Email Support', 'Financial Ledger'] },
              { name: 'Comprehensive', price: '149', desc: 'The operational standard.', featured: true, features: ['Unlimited Staff', 'Full AI Automation', 'Live GPS Tracking', 'Priority 24/7 Support', 'Custom Domain'] },
              { name: 'Elite', price: '499', desc: 'For large-scale enterprises.', features: ['White-label App', 'Custom AI Training', 'Direct API Access', 'Dedicated Manager', 'On-premise Options'] }
            ].map((plan, i) => (
              <Card key={i} className={cn(
                "rounded-[3.5rem] border-none p-10 flex flex-col h-full transition-all duration-500 hover:shadow-2xl",
                plan.featured ? "bg-slate-900 text-white scale-105 shadow-2xl z-10" : "bg-white text-slate-900 shadow-sm border border-slate-100"
              )}>
                <div className="space-y-8 mb-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
                    <p className={cn("text-sm font-medium", plan.featured ? "text-white/40" : "text-slate-400")}>{plan.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black uppercase opacity-60 mr-1">$</span>
                    <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                    <span className="text-xs font-bold opacity-40 uppercase tracking-widest">/mo</span>
                  </div>
                </div>

                <ul className="space-y-4 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.featured ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600")}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span className={plan.featured ? "text-white/70" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button className={cn(
                  "w-full h-16 rounded-2xl mt-12 font-black uppercase tracking-widest text-[10px] shadow-xl",
                  plan.featured ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                )}>
                  Select Protocol
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ❓ FAQ ACCORDION */}
      <section className="py-40 bg-slate-50/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center space-y-6 mb-24">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Technical <span className="text-indigo-600">Queries.</span></h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "Is there an additional setup fee for CAPI?", a: "No, the Meta Conversion API is built into the core infrastructure of the Comprehensive and Elite tiers at no extra charge." },
              { q: "Can we integrate our existing workforce data?", a: "Yes, our API protocols allow for seamless bulk importing of employee profiles and historical job data." },
              { q: "How accurate is the AI Dispatcher?", a: "Our engine uses a proprietary algorithm that consistently reduces travel time by 22% compared to manual scheduling." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-white px-8 rounded-3xl border border-slate-200/60 shadow-sm">
                <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-slate-800 hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-slate-500 font-medium leading-relaxed pb-6 text-sm">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 🚀 FINAL CALL TO ACTION */}
      <section className="py-40">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bg-slate-950 rounded-[4rem] p-16 md:p-32 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150"><Sparkles size={200} /></div>
            <div className="relative z-10 space-y-12">
               <h2 className="text-5xl md:text-[100px] font-black uppercase tracking-tighter leading-[0.8] italic">Deploy the <br /><span className="text-slate-700">Empire.</span></h2>
               <p className="text-white/40 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">Join the most successful cleaning enterprises in the world. Ready to scale your operations to the elite level?</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <Button asChild size="lg" className="h-20 px-16 rounded-[2.5rem] bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">
                    <Link href="/signup">Apply for Access</Link>
                 </Button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 INDEPENDENT MINIMAL FOOTER */}
      <footer className="py-24 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
            <div className="md:col-span-4 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">S</div>
                  <span className="font-black text-xl tracking-tighter uppercase">SmartClean</span>
               </div>
               <p className="text-slate-400 text-sm max-w-xs font-medium">The definitive operating system for professional service empires. Scalable, secure, and purely intelligent.</p>
            </div>
            
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              {[
                { title: 'Platform', links: ['Dispatcher', 'Audit', 'Fleet', 'CAPI'] },
                { title: 'Resources', links: ['Documentation', 'API Docs', 'Community', 'Status'] },
                { title: 'Company', links: ['Careers', 'Privacy', 'Security', 'Legal'] },
                { title: 'Support', links: ['Help Center', 'Partners', 'Expert Network'] }
              ].map((group, i) => (
                <div key={i} className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{group.title}</h4>
                  <ul className="space-y-3">
                    {group.links.map(l => (
                      <li key={l}><button className="text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-tight">{l}</button></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Proto-SaaS. All rights reserved.</p>
             <div className="flex gap-10">
               {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
                 <button key={s} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">{s}</button>
               ))}
             </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
