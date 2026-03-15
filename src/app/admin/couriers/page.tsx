
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  ExternalLink, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Plus, 
  Trash2, 
  Loader2,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CouriersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const couriersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'couriers'), orderBy('name', 'asc'));
  }, [db]);

  const { data: couriers, isLoading } = useCollection(couriersQuery);

  const handleAddCourier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const courierData = {
      name: formData.get('name') as string,
      status: 'Ready',
      description: formData.get('description') as string,
      color: 'bg-blue-50 text-blue-700',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'couriers'), courierData);
      toast({ title: "Courier Added" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Courier Logistics</h1>
          <p className="text-muted-foreground text-sm">Automate order shipping and nationwide tracking</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold h-11 shadow-lg">
              <Plus size={18} /> Add Courier Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddCourier} className="space-y-4">
              <DialogHeader><DialogTitle>New Logistics Provider</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Provider Name</Label>
                <Input name="name" required placeholder="e.g. RedX, Pathao" />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input name="description" placeholder="e.g. Fast local delivery in Dhaka" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Connect Provider
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline" /></div>
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
                <div className="pt-2 flex gap-2">
                   <Button variant="outline" className="flex-1 gap-1.5 text-[10px] font-bold h-9"><Settings size={14} /> Config</Button>
                   <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteCourier(courier.id)}><Trash2 size={16} /></Button>
                </div>
             </CardContent>
          </Card>
        ))}
        {!couriers?.length && !isLoading && (
          <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed text-muted-foreground italic">
            No courier partners configured. Add one to start automating shipments.
          </div>
        )}
      </div>

      <Card className="border-none shadow-sm bg-[#081621] text-white overflow-hidden rounded-3xl relative">
         <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
            <ShieldCheck size={120} />
         </div>
         <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-full shrink-0">
               <ShieldCheck size={48} className="text-primary" />
            </div>
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Enterprise Shipping Automation</h3>
               <p className="text-white/60 text-sm md:text-base max-w-xl leading-relaxed">
                 Integrate your logistics accounts to automatically generate waybills, print labels, and notify customers via SMS/Email instantly.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> Auto-Labeling</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> SMS Tracking</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Zap size={14} /> Return Sync</div>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
