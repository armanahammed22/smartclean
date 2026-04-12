'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, Target, Shield, Clock, Users, Headphones, TrendingUp, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Zap,
  Target,
  Shield,
  Clock,
  TrendingUp,
  Briefcase
};

export default function BillingPlansPage() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plansQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'subscription_plans'), orderBy('createdAt', 'asc')) : null, [db]);
  const { data: plans, isLoading } = useCollection(plansQuery);

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12 md:mb-16">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.3em] font-black py-1 px-4 rounded-full text-[9px]">
              Pricing & Packages
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter leading-none font-headline italic">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              Transparent pricing models designed for every household and commercial space. 
              Professional maintenance simplified.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
              {plans?.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative border-none shadow-sm flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-xl bg-white rounded-[2rem]",
                    plan.featured && "ring-2 ring-primary ring-offset-2 scale-[1.02] z-10 shadow-lg"
                  )}
                >
                  {plan.featured && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className={cn("p-6 md:p-8", plan.color || 'bg-gray-50')}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm text-primary">
                          {React.createElement(ICON_MAP[plan.icon] || Zap, { size: 20 })}
                        </div>
                        <div>
                          <Badge variant="outline" className="bg-white/50 border-none text-[7px] font-black uppercase tracking-widest mb-0.5 px-1.5">Membership</Badge>
                          <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">{plan.name}</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-primary tracking-tighter">{plan.price}</span>
                          <span className="text-gray-400 font-black text-xs uppercase">{plan.period}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                            <Clock size={8} className="mr-1 inline" /> {plan.frequency}
                          </Badge>
                          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                            <Target size={8} className="mr-1 inline" /> {plan.targetAudience}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 md:p-8 flex-1 flex flex-col bg-white">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Included Services</p>
                    <ul className="space-y-3.5 flex-1 mb-8">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className="p-0.5 rounded-full bg-green-100 text-green-600 mt-0.5 shrink-0">
                            <Check size={12} strokeWidth={4} />
                          </div>
                          <span className="text-gray-700 font-bold text-[11px] md:text-xs uppercase tracking-tight leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={cn(
                        "w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95",
                        plan.featured ? "bg-primary text-white shadow-primary/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                      )}
                    >
                      Subscribe & Activate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 🛡️ TRUST BAR COMPACT */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-gray-100 pt-12">
            {[
              { label: 'Secure Payments', desc: 'SSL Encrypted', icon: Shield },
              { label: 'Verified Pros', desc: 'Expert Team', icon: Users },
              { label: 'Flexible Cycle', desc: 'No Contracts', icon: Clock },
              { label: 'Priority Support', desc: '24/7 Agent', icon: Headphones }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-50 text-primary transition-transform group-hover:scale-110">
                  <item.icon size={18} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">{item.label}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
