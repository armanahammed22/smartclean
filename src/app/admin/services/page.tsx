
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, Clock, DollarSign, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ServicesManagementPage() {
  const db = useFirestore();

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('title', 'asc'));
  }, [db]);

  const { data: services, isLoading } = useCollection(servicesQuery);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Service Catalog</h1>
          <p className="text-muted-foreground text-sm">Configure your service offerings and pricing</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg">
          <Plus size={18} /> Add New Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-20">Loading services...</div>
        ) : services?.length ? (
          services.map((service) => (
            <Card key={service.id} className="border-none shadow-sm group hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Wrench size={24} />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">ACTIVE</Badge>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <DollarSign size={16} />
                    <span>৳{service.basePrice}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock size={14} />
                    <span>{service.duration || '2 hrs'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1"><Edit size={14} /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground italic">
            No services configured yet. Click "Add New Service" to start.
          </div>
        )}
      </div>
    </div>
  );
}
