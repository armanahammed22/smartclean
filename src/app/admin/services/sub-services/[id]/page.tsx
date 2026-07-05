"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, updateDoc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
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
  Image as ImageIcon, 
  CheckCircle2,
  X,
  ShieldCheck,
  Package,
  Wrench,
  Globe,
  Camera,
  RefreshCw,
  Layers,
  Settings2,
  Check,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function SubServiceEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isNew = id === 'new';

  // 1. Core Data
  const subServiceRef = useMemoFirebase(() => (db && !isNew) ? doc(db, 'sub_services', id as string) : null, [db, id, iNew]);
  const { data: subService, isLoading: sLoading } = useDoc(subServiceRef);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const { data: mainServices } = useCollection(servicesQuery);

  const [formData, setFormData] = useState<any>({
    name: '',
    mainServiceId: '',
    description: '',
    duration: '',
    rating: 5.0,
    imageUrl: '',
    galleryImages: [],
    videoUrl: '',
    price: '',
    regularPrice: '',
    pricingType: 'quantity',
    included: [],
    notIncluded: [],
    checklist: [],
    features: [],
    status: 'Active',
    isAddOnEnabled: true,
    isStandaloneEnabled: true,
    isDefaultAddOn: false
  });

  useEffect(() => {
    if (subService) {
      setFormData({
        ...formData,
        ...subService,
        price: subService.price?.toString() || '',
        regularPrice: subService.regularPrice?.toString() || '',
        rating: subService.rating || 5.0,
        included: subService.included || [],
        notIncluded: subService.notIncluded || [],
        checklist: subService.checklist || [],
        features: subService.features || [],
        galleryImages: subService.galleryImages || []
      });
    }
  }, [subService]);

  const handleSave = async (statusOverride?: string) => {
    if (!db) return;
    if (!formData.name || !formData.mainServiceId) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name and parent service are required." });
      return;
    }

    setIsSaving(true);
    const payload = {
      ...formData,
      status: statusOverride || formData.status,
      price: parseFloat(formData.price) || 0,
      regularPrice: parseFloat(formData.regularPrice) || 0,
      rating: parseFloat(formData.rating) || 5.0,
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'sub_services'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp(), bookingCount: 0 });
        toast({ title: "Sub-Service Created" });
      } else {
        await updateDoc(subServiceRef!, payload);
        toast({ title: "Sub-Service Updated" });
      }
      router.push('/admin/services/sub-services');
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (key: string, value: any = '') => setFormData({ ...formData, [key]: [...(formData[key] || []), value] });
  const updateArrayItem = (key: string, idx: number, value: any) => {
    const list = [...formData[key]];
    list[idx] = value;
    setFormData({ ...formData, [key]: list });
  };
  const removeArrayItem = (key: string, idx: number) => setFormData({ ...formData, [key]: formData[key].filter((_: any, i: number) => i !== idx) });

  if (!isNew && sLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 md:px-8 pt-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services/sub-services')} className="rounded-xl h-9 w-9 border border-gray-100">
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">
                {isNew ? 'Create New Sub-Service' : 'Edit Sub-Service'}
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Operational Logic Module</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('Inactive')} disabled={isSaving} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200">
              Save Draft
            </Button>
            <Button onClick={() => handleSave()} disabled={isSaving} className="h-10 px-8 rounded-xl font-black bg-primary text-white shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><ShieldCheck size={14} className="mr-2" /> Publish Sub-Service</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 items-start">
          
          {/* MEDIA PANEL */}
          <aside className="w-full lg:col-span-3 lg:sticky lg:top-6 space-y-4">
            <Card className="border-none shadow-sm rounded-[18px] bg-white overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-4 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                  <Camera size={14} className="text-primary" /> Media Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Featured Image</Label>
                  <ImageUploader 
                    initialUrl={formData.imageUrl} 
                    onUpload={url => setFormData({...formData, imageUrl: url})} 
                    aspectRatio="aspect-[4/3]"
                    className="shadow-inner rounded-xl overflow-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Gallery Images</Label>
                    <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5">{formData.galleryImages?.length || 0} Files</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden">
                      <ImageUploader 
                        initialUrl="" 
                        onUpload={url => addArrayItem('galleryImages', url)} 
                        label="" 
                        aspectRatio="aspect-[4/3]" 
                        className="absolute inset-0 opacity-0 z-20 cursor-pointer" 
                      />
                      <Plus size={20} className="text-gray-400" />
                    </div>

                    {formData.galleryImages?.slice(0, 1).map((img: string, i: number) => (
                      <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 group">
                        <Image src={img} alt="G" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeArrayItem('galleryImages', i)} className="p-1.5 bg-white text-destructive rounded-lg shadow-sm">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Video Source (Optional)</Label>
                  <div className="relative">
                    <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube Link" className="h-10 pl-9 bg-gray-50 border-none rounded-xl text-[10px] font-medium" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* MAIN FORM */}
          <main className="w-full lg:col-span-7 space-y-4 pb-24">
            
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100 overflow-hidden">
              <CardHeader className="bg-gray-50/50 p-5 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Package size={14} className="text-primary"/> Basic Specification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub-Service Title</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sofa Steam Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Parent Service Assignment</Label>
                    <Select value={formData.mainServiceId} onValueChange={v => setFormData({...formData, mainServiceId: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold text-xs"><SelectValue placeholder="Link to main service..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {mainServices?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Billing Type</Label>
                    <Select value={formData.pricingType} onValueChange={v => setFormData({...formData, pricingType: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="quantity" className="text-[10px] font-black uppercase">Per Quantity / PCS</SelectItem>
                        <SelectItem value="sqft" className="text-[10px] font-black uppercase">Per Square Feet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-600 ml-1">Offer Price</Label>
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 bg-emerald-50/30 border-none rounded-xl font-black text-emerald-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Regular Price</Label>
                    <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-amber-500 ml-1 flex items-center gap-1">Rating <Star size={10} fill="currentColor" /></Label>
                    <Input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} className="h-12 bg-amber-50/30 border-none rounded-xl font-black text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Est. Duration</Label>
                    <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="30 Mins" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 text-xs leading-relaxed focus:bg-white transition-all shadow-inner" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-emerald-50/30 p-4 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-emerald-700">What's Included</CardTitle>
                  <button type="button" onClick={() => addArrayItem('included')} className="text-emerald-600"><Plus size={16}/></button>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {formData.included?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <Input value={item} onChange={e => updateArrayItem('included', i, e.target.value)} className="h-9 bg-gray-50 border-none rounded-lg text-[10px] font-bold" />
                      <button type="button" onClick={() => removeArrayItem('included', i)} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-blue-50/30 p-4 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-blue-700">Checklist</CardTitle>
                  <button type="button" onClick={() => addArrayItem('checklist')} className="text-blue-600"><Plus size={16}/></button>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {formData.checklist?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <Input value={item} onChange={e => updateArrayItem('checklist', i, e.target.value)} className="h-9 bg-gray-50 border-none rounded-lg text-[10px] font-bold" />
                      <button type="button" onClick={() => removeArrayItem('checklist', i)} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                 <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                    <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Public Deployment</Label>
                    <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
                 </div>
                 <div className="flex items-center gap-4 bg-indigo-50/50 px-5 py-3 rounded-2xl border border-indigo-100">
                    <Label className="text-[10px] font-black uppercase text-indigo-500">Standalone</Label>
                    <Switch checked={formData.isStandaloneEnabled !== false} onCheckedChange={v => setFormData({...formData, isStandaloneEnabled: v})} />
                 </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="ghost" onClick={() => router.push('/admin/services/sub-services')} className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400">Discard</Button>
                <Button onClick={() => handleSave()} disabled={isSaving} className="flex-1 md:flex-none h-12 px-12 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} className="mr-2" /> Sync Records</>}
                </Button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
