
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, ExternalLink, Settings, ShieldCheck, Zap } from 'lucide-react';

export default function CouriersPage() {
  const COURIERS = [
    { name: 'Pathao Courier', status: 'Ready', desc: 'Fast local delivery in Dhaka & surrounding.', color: 'bg-red-50 text-red-700' },
    { name: 'RedX', status: 'API Configured', desc: 'Wide nationwide coverage for ERP logistics.', color: 'bg-orange-50 text-orange-700' },
    { name: 'Steadfast', status: 'Testing', desc: 'Reliable next-day delivery service.', color: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courier Logistics</h1>
          <p className="text-muted-foreground text-sm">Automate order shipping and tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {COURIERS.map((courier) => (
          <Card key={courier.name} className="border-none shadow-sm group hover:shadow-md transition-all bg-white rounded-2xl">
             <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-gray-50 border rounded-xl group-hover:bg-primary/5 group-hover:text-primary transition-all">
                      <Truck size={24} />
                   </div>
                   <Badge variant="secondary" className={`text-[9px] font-black border-none uppercase ${courier.color}`}>
                      {courier.status}
                   </Badge>
                </div>
                <CardTitle className="mt-4 text-base md:text-lg font-bold text-gray-900">{courier.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed line-clamp-2">{courier.desc}</p>
                <div className="pt-2 flex gap-2">
                   <Button variant="outline" className="flex-1 gap-1.5 text-[10px] font-bold h-9"><Settings size={14} /> Config</Button>
                   <Button variant="ghost" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-lg"><ExternalLink size={16} /></Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-primary text-white overflow-hidden rounded-3xl relative">
         <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
            <ShieldCheck size={120} />
         </div>
         <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-full shrink-0">
               <ShieldCheck size={48} />
            </div>
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">Enterprise Shipping Automation</h3>
               <p className="text-white/80 text-sm md:text-base max-w-xl leading-relaxed">
                 Integrate your logistics accounts to automatically generate waybills, print labels, and notify customers via SMS/Email instantly.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Zap size={14} className="text-white" /> Auto-Labeling</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Zap size={14} className="text-white" /> SMS Tracking</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Zap size={14} className="text-white" /> Return Sync</div>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
