
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Star, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Users, 
  ArrowRight, 
  Sparkles,
  Award,
  ChevronRight,
  Shield,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StandaloneLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 selection:bg-primary selection:text-white">
      
      {/* 🚀 MINIMALIST NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <span className="font-black text-xl tracking-tighter uppercase text-[#081621]">Smart<span className="text-primary">Clean</span></span>
          </div>
          <Button asChild className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
            <Link href="/services">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* 🎯 HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] animate-fade-in">
                Next-Gen Cleaning Solutions
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black text-[#081621] leading-[0.9] tracking-tighter uppercase italic">
                A Smarter Way <br />
                <span className="text-primary">To Clean</span> Your Space.
              </h1>
              <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Experience premium, tech-enabled cleaning services that give you back your time. Professional, reliable, and just a click away.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-tight shadow-2xl shadow-primary/30 group">
                  <Link href="/services" className="flex items-center gap-3">
                    Book a Service <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden relative">
                        <Image src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400">Trusted by 5k+ Clients</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                <Image 
                  src="https://picsum.photos/seed/cleanlanding/800/800" 
                  alt="Service Preview" 
                  fill 
                  className="object-cover" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-gray-50 animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">100%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 FEATURES SECTION */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-[#081621] uppercase tracking-tighter">Why We Are Different</h2>
            <p className="text-gray-500 font-medium text-lg">We've reimagined cleaning from the ground up, focusing on quality, trust, and simplicity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Smart Scheduling", desc: "Book your service in less than 60 seconds with our intuitive interface.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Shield, title: "Verified Pros", desc: "Every professional undergoes rigorous background checks and training.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Clock, title: "Punctuality", desc: "We value your time. Our team arrives exactly when promised, every time.", color: "text-amber-600", bg: "bg-amber-50" }
            ].map((f, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white p-10 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <CardContent className="p-0 space-y-6">
                  <div className={cn("p-5 rounded-2xl w-fit transition-transform group-hover:rotate-12", f.bg, f.color)}>
                    <f.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-[#081621] uppercase tracking-tight">{f.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ TESTIMONIALS SECTION */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-center md:text-left">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-[#081621] uppercase tracking-tighter">Voices of Trust</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
                <Star size={16} fill="#1E5F7A" className="text-primary" /> Rated 4.9/5 by 1,000+ Households
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 bg-gray-50 px-8 py-5 rounded-[2rem] border">
              <div className="text-right">
                <p className="text-3xl font-black leading-none">4.9</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Average Score</p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="flex gap-1 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Tahsin Ahmed", text: "The most professional cleaning service I've ever used in Dhaka. Their attention to detail is unmatched.", role: "Home Owner" },
              { name: "Nabila Kabir", text: "Finally, a service that understands the value of time and hygiene. My office has never looked better.", role: "Business Manager" },
              { name: "Rafiqul Islam", text: "Great tech, great staff, and great results. The booking process was so smooth!", role: "Tech Professional" }
            ].map((rev, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8 relative">
                <div className="flex text-primary gap-0.5">
                  {[1,2,3,4,5].map(j => <Star key={j} size={14} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 font-medium italic text-lg leading-relaxed">"{rev.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm uppercase">{rev.name[0]}</div>
                  <div>
                    <p className="font-black text-sm text-[#081621] uppercase tracking-tight">{rev.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📣 FINAL CTA SECTION */}
      <section className="py-32 container mx-auto px-6 max-w-5xl">
        <div className="bg-[#081621] rounded-[4rem] p-10 md:p-20 text-center space-y-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12 pointer-events-none">
            <Sparkles size={300} className="text-primary" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="p-4 bg-white/5 w-fit mx-auto rounded-3xl border border-white/10 mb-8">
              <ThumbsUp size={48} className="text-primary" />
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic">
              Ready for a <br />
              <span className="text-primary">Spotless</span> Experience?
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Join thousands of happy customers and transform your space today. No hidden fees, just pure clean.
            </p>
            <div className="pt-6">
              <Button asChild size="lg" className="h-20 px-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-2xl uppercase tracking-tight shadow-3xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <Link href="/services" className="flex items-center gap-4">
                  Book Now <ArrowRight size={28} />
                </Link>
              </Button>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pt-4">No Credit Card Required To Browse</p>
          </div>
        </div>
      </section>

      {/* 🏁 MINIMAL FOOTER */}
      <footer className="py-12 border-t border-gray-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
            <span className="font-black text-sm tracking-tighter uppercase">SmartClean</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Smart Clean Bangladesh. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/page/privacy-policy" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">Privacy</Link>
            <Link href="/page/terms-of-service" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
