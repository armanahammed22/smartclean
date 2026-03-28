
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Settings, 
  Save, 
  CheckCircle2, 
  Smartphone,
  CreditCard,
  Building2,
  Loader2,
  Info,
  ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92'];

export default function PaymentManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifying role status before querying restricted collections
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid));

  const methodsQuery = useMemoFirebase(() => 
    (db && user && isAuthorized) ? query(collection(db, 'payment_methods'), orderBy('name', 'asc')) : null, [db, user, isAuthorized]);
  const { data: methods, isLoading } = useCollection(methodsQuery);

  const handleToggleStatus = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'payment_methods', id), { isEnabled: !current });
    toast({ title: "Gateway Updated", description: `Status changed to ${!current ? 'Enabled' : 'Disabled'}` });
  };

  const handleUpdateLogo = async (id: string, url: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'payment_methods', id), { logoUrl: url });
    toast({ title: "Logo Updated" });
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm("Remove this gateway?")) return;
    await deleteDoc(doc(db, 'payment_methods', id));
    toast({ title: "Gateway Removed" });
  };

  const handleAddDefault = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const defaults = [
        { name: 'Cash on Delivery', type: 'cod', instructions: 'Pay when your package arrives.', isEnabled: true, isDefaultForProducts: true, isDefaultForServices: false, logoUrl: 'https://picsum.photos/seed/cod/200/200' },
        { name: 'Cash in Hand', type: 'cash', instructions: 'Pay after service.', isEnabled: true, isDefaultForProducts: false, isDefaultForServices: true, logoUrl: 'https://picsum.photos/seed/cash/200/200' },
        { name: 'bKash', type: 'mobile', accountNumber: '01919640422', instructions: 'Pay via bKash App.', isEnabled: true, isDefaultForProducts: false, isDefaultForServices: false, logoUrl: 'https://picsum.photos/seed/bkash/200/200' },
        { name: 'Nagad', type: 'mobile', accountNumber: '01919640422', instructions: 'Pay via Nagad App.', isEnabled: true, isDefaultForProducts: false, isDefaultForServices: false, logoUrl: 'https://picsum.photos/seed/nagad/200/200' }
      ];

      for (const method of defaults) {
        await addDoc(collection(db, 'payment_methods'), method);
      }
      toast({ title: "Default Methods Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic">Verifying Access...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-muted-foreground text-sm">Configure numbers, logos, and payment instructions</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleAddDefault} disabled={isSubmitting} className="gap-2 font-bold bg-white rounded-xl h-11 border-primary/20 text-primary">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Load Default BD Methods
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Overview</CardTitle>
            <CardDescription>Status of your active payment channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {methods?.map(m => (
               <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                     <div className="relative w-8 h-8 rounded-lg overflow-hidden border bg-white">
                        {m.logoUrl ? <Image src={m.logoUrl} alt={m.name} fill className="object-contain p-1" unoptimized /> : <ImageIcon size={16} className="m-auto text-gray-300" />}
                     </div>
                     <span className="text-sm font-bold text-gray-700">{m.name}</span>
                  </div>
                  <Switch checked={m.isEnabled} onCheckedChange={() => handleToggleStatus(m.id, m.isEnabled)} />
               </div>
             ))}
             {!methods?.length && !isLoading && <p className="text-xs text-muted-foreground italic text-center py-4">No gateways configured.</p>}
             {isLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
           {isLoading ? (
             <div className="py-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Syncing Gateways...</span>
             </div>
           ) : (
             methods?.map((method) => (
               <Card key={method.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                  <div className="h-1 bg-primary/10 w-full" />
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border shadow-xs text-primary overflow-hidden relative w-10 h-10">
                           {method.logoUrl ? <Image src={method.logoUrl} alt={method.name} fill className="object-contain" unoptimized /> : (method.type === 'mobile' ? <Smartphone size={18} /> : method.type === 'card' ? <CreditCard size={18} /> : <Wallet size={18} />)}
                        </div>
                        <div>
                           <CardTitle className="text-base font-black uppercase tracking-tight">{method.name}</CardTitle>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase">{method.type} Gateway</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(method.id)}>
                           <Trash2 size={14} />
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gateway Name</Label>
                              <Input 
                                defaultValue={method.name} 
                                onBlur={(e) => updateDoc(doc(db!, 'payment_methods', method.id), { name: e.target.value })}
                                className="h-11 bg-gray-50/50 rounded-xl"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Account Number</Label>
                              <Input 
                                defaultValue={method.accountNumber} 
                                placeholder="e.g. 019XXXXXXXX"
                                onBlur={(e) => updateDoc(doc(db!, 'payment_methods', method.id), { accountNumber: e.target.value })}
                                className="h-11 bg-gray-50/50 rounded-xl"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Instructions</Label>
                              <Textarea 
                                defaultValue={method.instructions} 
                                placeholder="Payment details..."
                                onBlur={(e) => updateDoc(doc(db!, 'payment_methods', method.id), { instructions: e.target.value })}
                                className="min-h-[80px] bg-gray-50/50 rounded-xl"
                              />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <ImageUploader 
                             label="Gateway Logo"
                             hint="200 x 200 px (PNG preferred)"
                             initialUrl={method.logoUrl}
                             aspectRatio="aspect-square w-24"
                             onUpload={(url) => handleUpdateLogo(method.id, url)}
                           />
                           
                           <div className="flex flex-col gap-4 pt-4 border-t">
                              <div className="flex items-center justify-between">
                                 <Label className="text-xs font-bold">Status</Label>
                                 <Switch 
                                   checked={method.isEnabled} 
                                   onCheckedChange={() => handleToggleStatus(method.id, method.isEnabled)} 
                                 />
                              </div>
                              <div className="flex items-center justify-between">
                                 <Label className="text-xs font-bold">Default Product</Label>
                                 <Switch 
                                   checked={method.isDefaultForProducts} 
                                   onCheckedChange={(val) => updateDoc(doc(db!, 'payment_methods', method.id), { isDefaultForProducts: val })} 
                                 />
                              </div>
                              <div className="flex items-center justify-between">
                                 <Label className="text-xs font-bold">Default Service</Label>
                                 <Switch 
                                   checked={method.isDefaultForServices} 
                                   onCheckedChange={(val) => updateDoc(doc(db!, 'payment_methods', method.id), { isDefaultForServices: val })} 
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
