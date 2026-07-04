
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, query, orderBy, deleteDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
  XCircle,
  Clock,
  Users,
  Settings2,
  Maximize,
  HelpCircle,
  Camera,
  Layers,
  X,
  ListChecks,
  ShieldCheck,
  Package,
  MoreVertical,
  Video,
  Info,
  DollarSign,
  Briefcase,
  Wrench,
  Search,
  Check,
  ChevronDown,
  Upload
} from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow 
} from '@/components/ui/table';
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
    beforeAfterImages: [],
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
        beforeAfterImages: service.beforeAfterImages || [],
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

  const filteredAddons = useMemo(() => {
    if (!subServicesPool) return [];
    return subServicesPool.filter(s => s.name.toLowerCase().includes(addonSearch.toLowerCase()));
  }, [subServicesPool, addonSearch]);

  if (!isNew && sLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 🚀 COMPACT HEADER */}
      <header className="sticky top-0 z-[100] bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-8 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-xl h-10 w-10 border border-gray-100">
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">
                {isNew ? 'Create New Service' : 'Edit Service'}
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Operational Logic Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleSave('Inactive')} disabled={isSaving} className="h-10 px-6 rounded-xl font-bold uppercase text-[10px] hidden sm:flex">
              Save Draft
            </Button>
            <Button onClick={() => handleSave()} disabled={isSaving} className="h-10 px-8 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-primary/20 bg-primary">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} className="mr-2" />}
              {isNew ? 'Publish Service' : 'Sync Changes'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* 🖼️ LEFT COLUMN: STICKY MEDIA PANEL (30-35%) */}
          <aside className="w-full lg:w-[35%] lg:sticky lg:top-24 space-y-6">
            <Card className="border-none shadow-sm rounded-[18px] bg-white overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                  <Camera size={16} className="text-primary" /> Media Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Main Image */}
                <ImageUploader 
                  label="Featured Listing Image" 
                  hint="800 x 600 px" 
                  initialUrl={formData.imageUrl} 
                  onUpload={url => setFormData({...formData, imageUrl: url})} 
                  aspectRatio="aspect-[4/3]" 
                />

                <div className="h-px bg-gray-100" />

                {/* Before & After */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Operation Results (Before/After)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <ImageUploader 
                        label="" 
                        hint="Before" 
                        initialUrl={formData.beforeAfterImages?.find((i:any) => i.tag === 'Before')?.url || ''} 
                        onUpload={url => {
                          const others = formData.beforeAfterImages?.filter((i:any) => i.tag !== 'Before') || [];
                          setFormData({...formData, beforeAfterImages: [...others, { url, tag: 'Before' }]});
                        }} 
                        aspectRatio="aspect-square" 
                      />
                      <p className="text-[8px] font-black text-center text-gray-400">BEFORE</p>
                    </div>
                    <div className="space-y-2">
                      <ImageUploader 
                        label="" 
                        hint="After" 
                        initialUrl={formData.beforeAfterImages?.find((i:any) => i.tag === 'After')?.url || ''} 
                        onUpload={url => {
                          const others = formData.beforeAfterImages?.filter((i:any) => i.tag !== 'After') || [];
                          setFormData({...formData, beforeAfterImages: [...others, { url, tag: 'After' }]});
                        }} 
                        aspectRatio="aspect-square" 
                      />
                      <p className="text-[8px] font-black text-center text-primary">AFTER</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Gallery */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gallery Feed</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.galleryImages?.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-gray-50 group">
                        <Image src={img} alt="Gallery" fill className="object-cover" unoptimized />
                        <button type="button" onClick={() => removeArrayItem('galleryImages', i)} className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-center border-2 border-dashed rounded-xl aspect-square bg-gray-50/50 hover:bg-white transition-all">
                      <ImageUploader initialUrl="" onUpload={url => addArrayItem('galleryImages', url)} label="" aspectRatio="aspect-square" className="border-none p-0" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Video Overview</Label>
                  <div className="relative">
                    <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube URL" className="h-10 pl-9 bg-gray-50 border-none rounded-xl text-[10px] font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* 📝 RIGHT COLUMN: FORM CONTENT (65-70%) */}
          <main className="w-full lg:w-[65%] space-y-6">
            
            {/* SECTION 1: BASIC & PRICING */}
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest">Core Definitions & Pricing</CardTitle></CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Headline</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Master Deep Home Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary ml-1">Offer Price (৳)</Label>
                    <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary text-lg shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Regular Price (৳)</Label>
                    <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pricing Model</Label>
                    <Select value={formData.pricingType} onValueChange={v => setFormData({...formData, pricingType: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fixed">Fixed Rate</SelectItem>
                        <SelectItem value="quantity">Per Unit</SelectItem>
                        <SelectItem value="sqft">Per Sqft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Qty Type</Label>
                      <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 1 Job" className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unit</Label>
                      <Input value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: e.target.value})} placeholder="e.g. Hour" className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Category (L1)</Label>
                    <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v, subCategoryId: '', childCategoryId: ''})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl"><SelectValue placeholder="L1" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Sub Category (L2)</Label>
                    <Select value={formData.subCategoryId} onValueChange={v => setFormData({...formData, subCategoryId: v, childCategoryId: ''})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl"><SelectValue placeholder="L2" /></SelectTrigger>
                      <SelectContent>
                        {availableSubCats.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Child Category (L3)</Label>
                    <Select value={formData.childCategoryId} onValueChange={v => setFormData({...formData, childCategoryId: v})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl"><SelectValue placeholder="L3" /></SelectTrigger>
                      <SelectContent>
                        {availableChildCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Story (Description)</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[140px] bg-gray-50 border-none rounded-xl p-6 leading-relaxed" />
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: ADD-ONS ENGINE */}
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Operational Add-ons</CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase mt-1">Link existing sub-services to this core logic</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">{formData.linkedSubServiceIds?.length || 0} LINKED</Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    value={addonSearch} 
                    onChange={e => setAddonSearch(e.target.value)} 
                    placeholder="Search sub-services inventory..." 
                    className="h-11 pl-10 bg-gray-50 border-none rounded-xl text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredAddons.map(s => {
                    const isSelected = formData.linkedSubServiceIds?.includes(s.id);
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => toggleLinkedAddon(s.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-50 bg-white hover:border-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", isSelected ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                            <Zap size={14} fill={isSelected ? "currentColor" : "none"} />
                          </div>
                          <span className="text-[11px] font-bold uppercase text-gray-700">{s.name}</span>
                        </div>
                        {isSelected ? <CheckCircle2 size={16} className="text-primary" /> : <Plus size={16} className="text-gray-200 group-hover:text-primary" />}
                      </div>
                    );
                  })}
                </div>

                {formData.linkedSubServiceIds?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {formData.linkedSubServiceIds.map((sid: string) => (
                      <Badge key={sid} variant="secondary" className="h-7 pl-3 pr-1 gap-2 rounded-lg border-none bg-gray-100 text-gray-700 font-bold text-[9px] uppercase">
                        {subServicesPool?.find(s => s.id === sid)?.name}
                        <button type="button" onClick={() => toggleLinkedAddon(sid)} className="p-0.5 hover:bg-gray-200 rounded-full text-red-500"><X size={10}/></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SECTION 3: CHECKLISTS & FEATURES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-emerald-50/50 p-6 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2"><Check size={14}/> Included</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => addArrayItem('included')} className="h-7 w-7 rounded-lg bg-white border text-emerald-600"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.included?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <Input value={item} onChange={e => updateArrayItem('included', i, e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                      <button type="button" onClick={() => removeArrayItem('included', i)} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-rose-50/50 p-6 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-700 flex items-center gap-2"><X size={14}/> Not Included</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => addArrayItem('notIncluded')} className="h-7 w-7 rounded-lg bg-white border text-rose-600"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.notIncluded?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <Input value={item} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                      <button type="button" onClick={() => removeArrayItem('notIncluded', i)} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
              <CardHeader className="bg-indigo-50/50 p-6 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2"><Zap size={14}/> Market Highlights</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => addArrayItem('features', { icon: 'Zap', title: 'Feature', desc: '' })} className="h-7 w-7 rounded-lg bg-white border text-indigo-600"><Plus size={14}/></Button>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.features?.map((f: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={f.icon} onChange={e => updateArrayItem('features', i, { ...f, icon: e.target.value })} placeholder="Icon Key" className="h-9 bg-white border-none rounded-lg text-[10px] font-black uppercase" />
                        <Input value={f.title} onChange={e => updateArrayItem('features', i, { ...f, title: e.target.value })} placeholder="Title" className="h-9 bg-white border-none rounded-lg font-bold text-xs" />
                      </div>
                      <Input value={f.desc} onChange={e => updateArrayItem('features', i, { ...f, desc: e.target.value })} placeholder="Short description" className="h-9 bg-white border-none rounded-lg text-[10px]" />
                      <button type="button" onClick={() => removeArrayItem('features', i)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 🏁 FOOTER ACTION SECTION */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 border-r border-gray-100 pr-8">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Deployment State</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
                    <span className={cn("text-[10px] font-black uppercase", formData.status === 'Active' ? "text-emerald-600" : "text-gray-400")}>{formData.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-inner">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <span className="text-[10px] font-black uppercase text-indigo-700">Verification Protocol Active</span>
                </div>
              </div>
              
              <div className="flex gap-4 w-full md:w-auto">
                <Button variant="ghost" onClick={() => router.push('/admin/services')} className="flex-1 md:flex-none h-14 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                <Button onClick={() => handleSave()} disabled={isSaving} className="flex-1 md:flex-none h-14 px-12 rounded-xl font-black bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Check size={18} className="mr-2" /> Publish Intelligence</>}
                </Button>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
