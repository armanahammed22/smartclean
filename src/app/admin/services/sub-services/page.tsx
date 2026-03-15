'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Layers, 
  Clock, 
  DollarSign,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    mainServiceId: ''
  });

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('title', 'asc'));
  }, [db]);

  const subServicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'sub_services'), orderBy('name', 'asc'));
  }, [db]);

  const { data: services } = useCollection(servicesQuery);
  const { data: subServices, isLoading } = useCollection(subServicesQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.name || !formData.mainServiceId) return;
    
    try {
      await addDoc(collection(db, 'sub_services'), {
        ...formData,
        price: parseFloat(formData.price) || 0,
        createdAt: new Date().toISOString()
      });
      setFormData({ name: '', description: '', price: '', duration: '', mainServiceId: '' });
      toast({ title: "Sub-Service Added", description: "Successfully linked to main service." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add sub-service." });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sub-Service Management</h1>
        <p className="text-muted-foreground text-sm">Configure task-specific add-ons for your main services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add Sub-Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Main Service Link</label>
                <Select value={formData.mainServiceId} onValueChange={(val) => setFormData({...formData, mainServiceId: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Main Service" /></SelectTrigger>
                  <SelectContent>
                    {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Sub-Service Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Kitchen Sanitization" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Price (BDT)</label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="1500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Duration</label>
                  <Input value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="1 hr" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Description</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Details about this specific task..." />
              </div>
              <Button type="submit" className="w-full font-bold h-11 gap-2"><Plus size={18} /> Add Service Task</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Syncing...</div>
          ) : subServices?.length ? (
            <div className="grid grid-cols-1 gap-4">
              {subServices.map((sub) => {
                const mainSrv = services?.find(s => s.id === sub.mainServiceId);
                return (
                  <Card key={sub.id} className="border-none shadow-sm group bg-white">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Layers size={20} /></div>
                        <div>
                          <h4 className="font-bold text-gray-900">{sub.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[8px] font-black uppercase">{mainSrv?.title || 'Standalone'}</Badge>
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1"><DollarSign size={10} /> {sub.price}</span>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Clock size={10} /> {sub.duration}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDoc(doc(db!, 'sub_services', sub.id))}>
                        <Trash2 size={16} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">No sub-services configured.</div>
          )}
        </div>
      </div>
    </div>
  );
}