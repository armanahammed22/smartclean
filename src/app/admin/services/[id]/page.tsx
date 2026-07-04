"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, updateDoc, query, orderBy, deleteDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
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
  Zap, 
  Star, 
  Image as ImageIcon, 
  Layout,
  CheckCircle2,
  Clock,
  Users,
  Settings2,
  Layers,
  X,
  ShieldCheck,
  Package,
  Wrench,
  Search,
  Check,
  ChevronDown,
  Upload,
  Globe,
  Camera,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function UnifiedServiceEditor() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isNew = id === 'new';

  // 1. Core Service Data
  const serviceRef = useMemoFirebase(() => (db && !isNew) ? doc(db, 'services', id as string) : null, [db, id, isNew]);
  const { data: service, isLoading: sLoading } = useDoc(serviceRef);

  // 2. Taxonomy & Master Data
  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);
  const childsQuery = useMemoFirebase(() => db ? query(collection(db, 'childcategories'), orderBy('name', 'asc')) : null, [db]);
  const allSubServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), where('status', '==', 'Active')) : null, [db]);

  const { data: categories } = useCollection(catsQuery);
  const { data: subcategories } = useCollection(subsQuery);
  const { data: childcategories } = useCollection(childsQuery);
  const { data: subServicesPool } = useCollection(allSubServicesQuery);

  // Unified State
  const [formData, setFormData] = useState<any>({
    title: '',
    categoryId: '',
    subCategoryId: '',
    childCategoryId: '',
    description: '',
    duration: '',
    teamSize: '',
    rating: 5.0,
    imageUrl: '',
    galleryImages: [],
    videoUrl: '',
    basePrice: '',
    regularPrice: '',
    extraCharges: 0,
    pricingType: 'fixed',
    sqftOptions: [],
    included: [],
    notIncluded: [],
    checklist: [],
    features: [],
    status: 'Active',
    isPopular: false,
    isBookingEnabled: true,
    linkedSubServiceIds: []
  });

  const [addonSearch, setAddonSearch] = useState('');

  useEffect(() => {
    if (service) {
      setFormData({
        ...formData,
        ...service,
        basePrice: service.basePrice?.toString() || '',
        regularPrice: service.regularPrice?.toString() || '',
        included: service.included || [],
        notIncluded: service.notIncluded || [],
        checklist: service.checklist || [],
        features: service.features || [],
        galleryImages: service.galleryImages || [],
        linkedSubServiceIds: service.linkedSubServiceIds || []
      });
    }
  }, [service]);

  // Taxonomy Filtering
  const availableSubCats = useMemo(() => subcategories?.filter(s => s.categoryId === formData.categoryId) || [], [subcategories, formData.categoryId]);
  const availableChildCats = useMemo(() => childcategories?.filter(c => c.subcategoryId === formData.subCategoryId) || [], [childcategories, formData.subCategoryId]);

  const handleSave = async (statusOverride?: string) => {
    if (!db) return;
    if (!formData.title) {
      toast({ variant: "destructive", title: "Missing Information", description: "Service title is required." });
      return;
    }

    setIsSaving(true);
    const slug = formData.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const payload = {
      ...formData,
      slug,
      status: statusOverride || formData.status,
      basePrice: parseFloat(formData.basePrice) || 0,
      regularPrice: parseFloat(formData.regularPrice) || 0,
      extraCharges: parseFloat(formData.extraCharges) || 0,
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'services'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Service Created Successfully" });
        router.push('/admin/services');
      } else {
        await updateDoc(serviceRef!, payload);
        toast({ title: "Service Configuration Published" });
      }
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

  const toggleLinkedAddon = (id: string) => {
    const current = formData.linkedSubServiceIds || [];
    const next = current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id];
    setFormData({ ...formData, linkedSubServiceIds: next });
  };

  if (!isNew && sLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 🚀 COMPACT STICKY HEADER */}
      <header className="sticky top-0 z-[100] bg-white border-b border-gray-200 h-14 flex items-center px-4 md:px-8 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-xl h-9 w-9 border border-gray-100">
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">
                {isNew ? 'Create New Service' : 'Edit Service'}
              </h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Operational Logic Terminal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-6 items-start">
          
          {/* 🖼️ LEFT COLUMN: COMPACT MEDIA PANEL (30%) */}
          <aside className="w-full lg:col-span-3 lg:sticky lg:top-20 space-y-6">
            <Card className="border-none shadow-sm rounded-[18px] bg-white overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-5 border-b">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                  <Camera size={14} className="text-primary" /> Media Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-8">
                {/* Main Image */}
                <ImageUploader 
                  label="Featured Image" 
                  hint="800 x 600 px" 
                  initialUrl={formData.imageUrl} 
                  onUpload={url => setFormData({...formData, imageUrl: url})} 
                  aspectRatio="aspect-[4/3]" 
                />

                <div className="h-px bg-gray-100" />

                {/* 📸 COMPACT GALLERY MANAGER */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gallery Feed</Label>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-none h-4 px-1.5">
                      {formData.galleryImages?.length || 0} Images
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Add More Slot */}
                    <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-white hover:border-primary/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group overflow-hidden">
                      <ImageUploader initialUrl="" onUpload={url => addArrayItem('galleryImages', url)} label="" aspectRatio="aspect-square" className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
                      <Plus size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-black uppercase text-gray-400 group-hover:text-primary mt-1">Add</span>
                    </div>

                    {formData.galleryImages?.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white group shadow-xs">
                        <Image src={img} alt="Gallery" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => removeArrayItem('galleryImages', i)} className="p-1.5 bg-white text-destructive rounded-lg shadow-sm hover:scale-110 transition-transform">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-100 text-center">
                       <p className="text-[9px] font-bold text-gray-300 uppercase italic">No gallery images yet.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Video Link</Label>
                  <div className="relative">
                    <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube URL" className="h-9 pl-9 bg-gray-50 border-none rounded-xl text-[10px] font-mono shadow-inner" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* 📝 RIGHT COLUMN: FORM CONTENT (70%) */}
          <main className="w-full lg:col-span-7 space-y-6">
            
            {/* SECTION 1: BASIC INFO & TAXONOMY */}
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Package size={14} className="text-primary"/> Primary Identification & Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Title</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Master Deep Home Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category (L1)</Label>
                    <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v, subCategoryId: '', childCategoryId: ''})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Primary Tier" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {categories?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs uppercase font-bold">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub Category (L2)</Label>
                    <Select value={formData.subCategoryId} onValueChange={v => setFormData({...formData, subCategoryId: v, childCategoryId: ''})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Secondary Tier" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableSubCats.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub-Child Category (L3)</Label>
                    <Select value={formData.childCategoryId} onValueChange={v => setFormData({...formData, childCategoryId: v})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Deepest Tier" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableChildCats.map(c => <SelectItem key={c.id} value={c.id} className="text-xs uppercase font-bold">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-600 ml-1">Offer Price (৳)</Label>
                      <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="h-11 bg-emerald-50/50 border-none rounded-xl font-black text-emerald-700 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Regular Price (৳)</Label>
                      <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-black text-gray-400 shadow-inner" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pricing Model</Label>
                    <Select value={formData.pricingType} onValueChange={v => setFormData({...formData, pricingType: v})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fixed" className="text-xs uppercase font-bold">Fixed Rate</SelectItem>
                        <SelectItem value="quantity" className="text-xs uppercase font-bold">By Quantity</SelectItem>
                        <SelectItem value="sqft" className="text-xs uppercase font-bold">By Square Feet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Duration Unit</Label>
                    <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 2 Hours" className="h-11 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Team Size</Label>
                    <Input value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: e.target.value})} placeholder="e.g. 2-3 Pros" className="h-11 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Visibility Status</Label>
                    <div className="flex items-center justify-between h-11 bg-gray-50 px-4 rounded-xl shadow-inner border border-gray-100">
                       <span className={cn("text-[10px] font-black uppercase", formData.status === 'Active' ? "text-emerald-600" : "text-gray-400")}>{formData.status}</span>
                       <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] bg-gray-50 border-none rounded-xl p-4 leading-relaxed shadow-inner" />
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: ADD-ONS SELECTOR */}
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} className="text-primary"/> Optional Add-ons
                </CardTitle>
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">{formData.linkedSubServiceIds?.length || 0} Linked</Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                  <Input 
                    value={addonSearch} 
                    onChange={e => setAddonSearch(e.target.value)} 
                    placeholder="Search sub-services catalog..." 
                    className="h-10 pl-9 bg-gray-50 border-none rounded-xl text-[11px] font-medium shadow-inner focus:bg-white"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {subServicesPool?.filter(s => s.name.toLowerCase().includes(addonSearch.toLowerCase())).map(s => {
                    const isSelected = formData.linkedSubServiceIds?.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleLinkedAddon(s.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase transition-all flex items-center gap-2",
                          isSelected ? "bg-primary border-primary text-white shadow-md" : "bg-white border-gray-100 text-gray-400 hover:border-primary/30"
                        )}
                      >
                        {isSelected ? <CheckCircle2 size={12}/> : <Plus size={12}/>}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: INCLUDED/EXCLUDED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-emerald-50/30 p-5 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-emerald-700 tracking-widest flex items-center gap-2"><Check size={14}/> Included</CardTitle>
                  <button type="button" onClick={() => addArrayItem('included')} className="text-emerald-600 hover:scale-110 transition-transform"><Plus size={16}/></button>
                </CardHeader>
                <CardContent className="p-5 space-y-2">
                  {formData.included?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item} onChange={e => updateArrayItem('included', i, e.target.value)} className="h-9 bg-gray-50 border-none rounded-lg text-xs font-bold" />
                      <button type="button" onClick={() => removeArrayItem('included', i)} className="text-gray-300 hover:text-rose-500"><X size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-rose-50/30 p-5 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-rose-700 tracking-widest flex items-center gap-2"><X size={14}/> Excluded</CardTitle>
                  <button type="button" onClick={() => addArrayItem('notIncluded')} className="text-rose-600 hover:scale-110 transition-transform"><Plus size={16}/></button>
                </CardHeader>
                <CardContent className="p-5 space-y-2">
                  {formData.notIncluded?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} className="h-9 bg-gray-50 border-none rounded-lg text-xs font-bold" />
                      <button type="button" onClick={() => removeArrayItem('notIncluded', i)} className="text-gray-300 hover:text-rose-500"><X size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* SECTION 4: UNIFIED FOOTER ACTION BAR */}
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <Button variant="ghost" onClick={() => router.push('/admin/services')} className="w-full md:w-auto h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest text-gray-400">
                ← Discard
              </Button>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={() => handleSave('Inactive')} disabled={isSaving} className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200">
                  Save Draft
                </Button>
                <Button onClick={() => handleSave()} disabled={isSaving} className="flex-1 md:flex-none h-12 px-12 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={16} className="mr-2" /> Publish Service</>}
                </Button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

