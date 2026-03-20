
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Plus, 
  Trash2, 
  Loader2,
  Save,
  Globe,
  Code,
  Lock,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function CouriersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourier, setEditingCourier] = useState<any>(null);

  const couriersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'couriers'), orderBy('name', 'asc'));
  }, [db]);

  const { data: couriers, isLoading } = useCollection(couriersQuery);

  const handleSaveCourier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const courierData = {
      name: formData.get('name') as string,
      apiEndpoint: formData.get('apiEndpoint') as string,
      apiKey: formData.get('apiKey') as string,
      apiSecret: formData.get('apiSecret') as string,
      fieldMapping: formData.get('fieldMapping') as string,
      status: 'Ready',
      description: formData.get('description') as string,
      color: 'bg-blue-50 text-blue-700',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingCourier) {
        await updateDoc(doc(db, 'couriers', editingCourier.id), courierData);
        toast({ title: "Courier Updated" });
      } else {
        await addDoc(collection(db, 'couriers'), {
          ...courierData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Courier Connected" });
      }
      setIsDialogOpen(false);
      setEditingCourier(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving Config" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCourier = async (id: string) => {
    if (!db || !confirm("Remove this courier partner?")) return;
    await deleteDoc(doc(db, 'couriers', id));
    toast({ title: "Courier Removed" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Logistics Hub</h1>
          <p className="text-muted-foreground text-sm">Scalable multi-courier API automation</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCourier(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold h-11 shadow-lg">
              <Plus size={18} /> Add Logistics Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <form onSubmit={handleSaveCourier} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingCourier ? 'Update Provider' : 'Connect New Provider'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Provider Name</Label>
                    <Input name="name" defaultValue={editingCourier?.name} required placeholder="e.g. RedX, Pathao" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">API Endpoint URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="apiEndpoint" defaultValue={editingCourier?.apiEndpoint} required placeholder="https://api.courier.com/v1/orders" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Short Bio</Label>
                    <Input name="description" defaultValue={editingCourier?.description} placeholder="Fast local delivery" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-primary"><Lock size={12} /> API Key / Token</Label>
                    <Input name="apiKey" defaultValue={editingCourier?.apiKey} placeholder="Bearer token or Key" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-primary"><Key size={12} /> Client Secret (Optional)</Label>
                    <Input name="apiSecret" defaultValue={editingCourier?.apiSecret} placeholder="OAuth secret if required" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-600"><Code size={12} /> Field Mapping (JSON)</Label>
                    <Textarea 
                      name="fieldMapping" 
                      defaultValue={editingCourier?.fieldMapping} 
                      placeholder='{"dest_name": "customerName", "dest_addr": "address"}' 
                      className="font-mono text-[10px] h-24"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="font-black px-8">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} className="mr-2" />}
                  Save Configuration
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline text-primary" size={32} /></div>
        ) : couriers?.map((courier) => (
          <Card key={courier.id} className="border-none shadow-sm group hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden border-t-4 border-primary/10">
             <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-gray-50 border rounded-xl group-hover:bg-primary/5 group-hover:text-primary transition-all">
                      <Truck size={24} />
                   </div>
                   <Badge variant="secondary" className={cn("text-[9px] font-black border-none uppercase", courier.color)}>
                      {courier.status}
                   </Badge>
                </div>
                <CardTitle className="mt-4 text-lg font-bold text-gray-900">{courier.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{courier.description}</p>
                <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                   <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1"><Globe size={10} /> Endpoint</p>
                   <p className="text-[10px] font-mono truncate text-blue-600">{courier.apiEndpoint}</p>
                </div>
                <div className="pt-2 flex gap-2">
                   <Button variant="outline" className="flex-1 gap-1.5 text-[10px] font-bold h-9" onClick={() => { setEditingCourier(courier); setIsDialogOpen(true); }}>
                      <Settings size={14} /> Config
                   </Button>
                   <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteCourier(courier.id)}>
                      <Trash2 size={16} />
                   </Button>
                </div>
             </CardContent>
          </Card>
        ))}
        {!couriers?.length && !isLoading && (
          <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed text-muted-foreground italic">
            No dynamic providers configured. Link an API to start automating.
          </div>
        )}
      </div>

      <Card className="border-none shadow-sm bg-[#081621] text-white overflow-hidden rounded-3xl relative">
         <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><ShieldCheck size={120} /></div>
         <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-full shrink-0">
               <ShieldCheck size={48} className="text-primary" />
            </div>
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Scalable API Architecture</h3>
               <p className="text-white/60 text-sm md:text-base max-w-xl leading-relaxed">
                 Smart Clean automatically maps order fields to any REST API. Add RedX, Pathao, or Paperfly by simply pasting their documentation endpoints and JSON mapping here.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> Dynamic Mapping</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> Batch Processing</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> Tracking Proxy</div>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
