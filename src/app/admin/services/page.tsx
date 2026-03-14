
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, Clock, DollarSign, Trash2, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ServicesManagementPage() {
  const db = useFirestore();

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('title', 'asc'));
  }, [db]);

  const { data: services, isLoading } = useCollection(servicesQuery);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-muted-foreground text-sm">Configure your service offerings and pricing</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg h-11">
          <Plus size={18} /> Add New Service
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full py-24 text-center flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-muted-foreground font-medium">Loading catalog...</span>
          </div>
        ) : services?.length ? (
          services.map((service) => (
            <Card key={service.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white">
              <CardHeader className="pb-3 bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-white border rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <Wrench size={20} />
                  </div>
                  <Badge className="text-[9px] font-black border-none bg-green-100 text-green-700">ACTIVE</Badge>
                </div>
                <CardTitle className="mt-4 text-base font-bold text-gray-900 line-clamp-1">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Price From</span>
                    <span className="text-base font-black text-primary">৳{service.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Duration</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
                      <Clock size={10} /> {service.duration || '2 hrs'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-[10px] font-bold">
                    <Edit size={12} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-lg shrink-0">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
            <Wrench size={40} className="mx-auto mb-4 opacity-10" />
            No services configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
