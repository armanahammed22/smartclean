
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, query, orderBy, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ShoppingCart,
  X,
  Search,
  Check,
  Wrench,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function PackageEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const isNew = id === 'new';
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const packageRef = useMemoFirebase(() => (db && !isNew) ? doc(db, 'service_packages', id as string) : null, [db, id, isNew]);
  const { data: packageData, isLoading: pLoading } = useDoc(packageRef);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const { data: allServices, isLoading: sLoading } = useCollection(servicesQuery);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    regularPrice: '',
    imageUrl: '',
    status: 'Active',
    serviceIds: [] as string[]
  });

  useEffect(() => {
    if (packageData) {
      setFormData({
        ...formData,
        ...packageData,
        price: packageData.price?.toString() || '',
        regularPrice: packageData.regularPrice?.toString() || '',
        serviceIds: packageData.serviceIds || []
      });
    }
  }, [packageData]);

  const toggleService = (sid: string) => {
    const current = formData.serviceIds || [];
    const next = current.includes(sid) ? current.filter(i => i !== sid) : [...current, sid];
    setFormData({ ...formData, serviceIds: next });
  };

  const handleSave = async () => {
    if (!db) return;
    if (!formData.name || !formData.price || formData.serviceIds.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, price and at least one service required." });
      return;
    }

    setIsSaving(true);
    const slug = formData.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Cache service names for invoice logic
    const includedServiceNames = allServices?.filter(s => formData.serviceIds.includes(s.id)).map(s => s.title) || [];

    const payload = {
      ...formData,
      slug,
      price: parseFloat(formData.price) || 0,
      regularPrice: parseFloat(formData.regularPrice) || 0,
      includedServiceNames,
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'service_packages'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Package Created" });
      } else {
        await updateDoc(packageRef!, payload);
        toast({ title: "Package Updated" });
      }
      router.push('/admin/services/packages');
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = allServices?.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isNew && pLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto min-w-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services/packages')} className="rounded-2xl bg-gray-50 hover:bg-gray-100 h-12 w-12 border">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{isNew ? 'Bundle Designer' : 'Edit Bundle'}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
               <Layers size={12} className="text-primary"/> Multi-Service Packaging Terminal
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-12 px-10 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 gap-3 bg-primary hover:bg-[#15435a]">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sync Bundle
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: General Config */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Bundle Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Package Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Deep Home Cleaning Bundle" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bundle Fixed Price (৳)</Label>
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary text-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Regular Total (৳)</Label>
                    <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Explain why this bundle is better value..." className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6" />
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                   <div className="space-y-1">
                      <Label className="text-xs font-black uppercase text-primary">Live Status</Label>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">VISIBLE TO CUSTOMERS IF ON</p>
                   </div>
                   <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-8 border-b"><CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Visual Identity</CardTitle></CardHeader>
             <CardContent className="p-8">
                <ImageUploader label="Bundle Header Image" hint="1200 x 400 px" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} aspectRatio="aspect-[21/7]" />
             </CardContent>
          </Card>
        </div>

        {/* Right: Service Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Wrench size={18} /> Components Selection</h3>
            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">{formData.serviceIds.length} SERVICES</Badge>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100 h-[650px] flex flex-col">
            <CardHeader className="p-6 bg-gray-50/50 border-b">
               <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter catalog..." className="h-10 pl-10 border-none bg-white rounded-xl text-xs" />
               </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
              {sLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div> : 
                filteredServices?.map((service) => {
                  const isSelected = formData.serviceIds.includes(service.id);
                  return (
                    <div 
                      key={service.id} 
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                        isSelected ? "border-primary bg-primary/5 shadow-md" : "border-gray-50 bg-white hover:border-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs", isSelected ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                           {service.title[0]}
                         </div>
                         <div className="min-w-0">
                           <p className="font-bold text-xs uppercase truncate leading-none mb-1 text-gray-900">{service.title}</p>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Normal: ৳{service.basePrice}</p>
                         </div>
                      </div>
                      <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary text-white" : "border-gray-100 bg-gray-50")}>
                         {isSelected && <Check size={14} strokeWidth={4}/>}
                      </div>
                    </div>
                  );
                })
              }
            </CardContent>
            <div className="p-6 bg-blue-50 border-t border-blue-100 flex items-start gap-4">
              <Info size={24} className="text-blue-600 mt-1 shrink-0" />
              <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-tight">
                প্যাকেজে অন্তর্ভুক্ত সার্ভিসগুলো ইনভয়েসে আলাদাভাবে স্কোপ হিসেবে দেখা যাবে। এতে কাস্টমার প্রফেশনাল ফিল পাবেন।
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
