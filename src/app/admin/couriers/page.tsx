
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
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Courier & Logistics Integration</h1>
          <p className="text-muted-foreground text-sm">Automate order shipping and tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {COURIERS.map((courier) => (
          <Card key={courier.name} className="border-none shadow-sm group hover:shadow-md transition-all">
             <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Truck size={24} />
                   </div>
                   <Badge variant="secondary" className={`text-[9px] font-bold border-none ${courier.color}`}>
                      {courier.status}
                   </Badge>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{courier.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{courier.desc}</p>
                <div className="pt-4 flex gap-2">
                   <Button variant="outline" className="flex-1 gap-1 text-xs font-bold h-10"><Settings size={14} /> Configure</Button>
                   <Button variant="ghost" className="h-10 text-primary"><ExternalLink size={16} /></Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
         <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="p-6 bg-primary/5 rounded-full text-primary shrink-0">
               <ShieldCheck size={64} />
            </div>
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-2xl font-bold font-headline">Enterprise Shipping Automation</h3>
               <p className="text-muted-foreground max-w-xl">
                 Integrate your logistics accounts to automatically generate waybills, print labels, and notify customers via SMS/Email the moment an order is marked as "Shipped".
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 text-sm font-bold"><Zap size={16} className="text-primary" /> Auto-Labeling</div>
                  <div className="flex items-center gap-2 text-sm font-bold"><Zap size={16} className="text-primary" /> SMS Tracking</div>
                  <div className="flex items-center gap-2 text-sm font-bold"><Zap size={16} className="text-primary" /> Return Processing</div>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
