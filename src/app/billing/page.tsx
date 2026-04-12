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
      <div className="bg-[#F9FAFB] min-h-screen py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16 md:mb-20">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.3em] font-black py-1.5 px-6 rounded-full text-[10px]">
              Pricing & Packages
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black text-[#081621] uppercase tracking-tighter leading-none font-headline">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Transparent pricing models designed for every household and commercial space. Save up to 20% with annual commitments.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 items-stretch">
              {plans?.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative border-none shadow-sm flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-[2.5rem]",
                    plan.featured && "ring-4 ring-primary ring-offset-4 scale-105 z-10"
                  )}
                >
                  {plan.featured && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl shadow-lg uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className={cn("p-8 md:p-10", plan.color || 'bg-gray-50')}>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                          {React.createElement(ICON_MAP[plan.icon] || Zap, { size: 24 })}
                        </div>
                        <div>
                          <Badge variant="outline" className="bg-white/50 border-none text-[8px] font-black uppercase tracking-widest mb-1 px-2">Membership Tier</Badge>
                          <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">{plan.name}</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black text-primary tracking-tighter">{plan.price}</span>
                          <span className="text-gray-400 font-black text-sm uppercase">{plan.period}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                            <Clock size={10} className="mr-1 inline" /> {plan.frequency}
                          </Badge>
                          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                            <Target size={10} className="mr-1 inline" /> {plan.targetAudience}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 md:p-10 flex-1 flex flex-col bg-white">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-6">Service Checklist</p>
                    <ul className="space-y-5 flex-1 mb-10">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-4">
                          <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5 shrink-0">
                            <Check size={14} strokeWidth={4} />
                          </div>
                          <span className="text-gray-700 font-bold text-xs md:text-sm uppercase tracking-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={cn(
                        "w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95",
                        plan.featured ? "bg-primary text-white shadow-primary/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      )}
                    >
                      Subscribe & Activate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 🛡️ TRUST BAR */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Secure Payments', desc: 'SSL Encrypted', icon: Shield },
              { label: 'Verified Pros', desc: 'Background Checked', icon: Users },
              { label: 'Flexible Cycle', desc: 'Cancel Anytime', icon: Clock },
              { label: 'Priority Support', desc: '24/7 Hotline', icon: Headphones }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-white rounded-2xl shadow-sm border text-primary">
                  <item.icon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-900 leading-none mt-1">{item.label}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
