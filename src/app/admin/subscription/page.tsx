'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Zap, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const PLANS = [
    {
      name: 'Basic',
      price: '৳2,500',
      period: '/mo',
      features: ['Up to 5 Employees', 'Lead Management', 'Email Support', 'Basic Analytics'],
      color: 'bg-gray-50',
      icon: Zap
    },
    {
      name: 'Pro',
      price: '৳7,500',
      period: '/mo',
      features: ['Unlimited Employees', 'AI Chatbot Agent', 'WhatsApp Automation', 'Advanced Reports'],
      color: 'bg-primary/5',
      featured: true,
      icon: Shield
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: ['White-label Branding', 'Custom Lead Gen API', '24/7 Priority Support', 'Dedicated Manager'],
      color: 'bg-gray-50',
      icon: TrendingUp
    }
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subscription & Billing</h1>
          <p className="text-muted-foreground text-sm">Manage your SaaS plan and platform usage</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Current Plan: Pro</Badge>
          <Badge variant="outline">Expires: Dec 2026</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={cn(
            "relative border-none shadow-sm flex flex-col h-full overflow-hidden",
            plan.featured && "ring-2 ring-primary shadow-xl scale-105 z-10"
          )}>
            {plan.featured && <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-lg">POPULAR</div>}
            <CardHeader className={cn("p-8", plan.color)}>
              <plan.icon size={32} className="text-primary mb-4" />
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button className={cn("w-full font-bold h-12", !plan.featured && "variant-outline")}>
                {plan.name === 'Pro' ? 'Manage Billing' : 'Upgrade Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm mt-12">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground italic text-sm">
            Recent invoices will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
