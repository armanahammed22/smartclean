"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
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
  Image as ImageIcon, 
  CheckCircle2,
  Clock,
  Users,
  Layers,
  X,
  ShieldCheck,
  Package,
  Wrench,
  Search,
  Check,
  Globe,
  Camera,
  RefreshCw,
  ChevronDown,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * 🔍 Reusable Searchable Single Select Component
 */
const SearchableSingleSelect = ({ 
  label, 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  disabled = false 
}: { 
  label: string, 
  value: string, 
  onValueChange: (v: string) => void, 
  options: any[], 
  placeholder: string, 
  disabled?: boolean 
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedLabel = options.find(o => o.id === value)?.name || placeholder;
  const filtered = options.filter(o => (o.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button variant="outline" className={cn(
            "h-12 w-full justify-between rounded-xl border-none bg-gray-50 font-bold text-xs shadow-inner hover:bg-white border hover:border-gray-200 transition-all",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
            <span className="truncate">{value ? selectedLabel : placeholder}</span>
            <ChevronDown size={14} className="opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden z-[200]">
          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search..." 
                className="h-9 pl-8 bg-white border-none rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onValueChange(opt.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all",
                  value === opt.id ? "bg-primary text-white" : "hover:bg-gray-50 text-gray-600"
                )}
              >
                {opt.name}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">No results</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

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
    subChildCategoryId: '',
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
  const [isAddonPopoverOpen, setIsAddonPopoverOpen] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        ...formData,
        ...service,
        basePrice: service.basePrice?.toString() || '',
        regularPrice: service.regularPrice?.toString() || '',
        rating: service.rating || 5.0,
        included: service.included || [],
        notIncluded: service.notIncluded || [],
        checklist: service.checklist || [],
        features: service.features || [],
        galleryImages: service.galleryImages || [],
        linkedSubServiceIds: service.linkedSubServiceIds || [],
        subChildCategoryId: service.subChildCategoryId || service.childCategoryId || ''
      });
    }
  }, [service]);

  // Taxonomy Filtering Logic
  const availableSubCats = useMemo(() => 
    subcategories?.filter(s => s.categoryId === formData.categoryId) || [], 
    [subcategories, formData.categoryId]
  );
  
  const availableChildCats = useMemo(() => 
    childcategories?.filter(c => c.subcategoryId === formData.subCategoryId) || [], 
    [childcategories, formData.subCategoryId]
  );

  const handleSave = async (statusOverride?: string) => {
    if (!db) return;
    if (!formData.title) {
      toast({ variant: "destructive", title: "Missing Information", description: "Service title is required." });
      return;
    }

    if (!formData.categoryId || !formData.subCategoryId) {
      toast({ variant: "destructive", title: "Hierarchy Required", description: "Category and Sub Category are mandatory." });
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
      rating: parseFloat(formData.rating) || 5.0,
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'services'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp(), bookingCount: 0 });
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

  const selectedAddons = useMemo(() => {
    return subServicesPool?.filter(s => formData.linkedSubServiceIds?.includes(s.id)) || [];
  }, [subServicesPool, formData.linkedSubServiceIds]);

  const filteredAddonResults = useMemo(() => {
    return subServicesPool?.filter(s => s.name.toLowerCase().includes(addonSearch.toLowerCase())) || [];
  }, [subServicesPool, addonSearch]);

  if (!isNew && sLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 md:px-8 pt-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-xl h-9 w-9 border border-gray-100">
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">
                {isNew ? 'Create New Service' : 'Edit Service'}
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Management Terminal</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('Inactive')} disabled={isSaving} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200">
              Save Draft
            </Button>
            <Button onClick={() => handleSave()} disabled={isSaving} className="h-10 px-8 rounded-xl font-black bg-primary text-white shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><ShieldCheck size={14} className="mr-2" /> Publish</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 items-start">
          
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
                    <Label className="text-[9px] font-black uppercase text-gray-400">Gallery</Label>
                    <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5">{formData.galleryImages?.length || 0} Files</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group">
                      <ImageUploader 
                        initialUrl="" 
                        onUpload={url => addArrayItem('galleryImages', url)} 
                        label="" 
                        aspectRatio="aspect-[4/3]" 
                        className="absolute inset-0 opacity-0 z-20 cursor-pointer" 
                      />
                      <Plus size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
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
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Video Promo URL</Label>
                  <div className="relative">
                    <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube / Vimeo URL" className="h-10 pl-9 bg-gray-50 border-none rounded-xl text-[10px] font-medium shadow-inner" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="w-full lg:col-span-7 space-y-4 pb-24">
            
            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100 overflow-hidden">
              <CardHeader className="bg-gray-50/50 p-5 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Package size={14} className="text-primary"/> Service Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-8 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Title</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Master Deep Cleaning..." className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  
                  {/* 3-Level Cascading Taxonomy Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SearchableSingleSelect 
                      label="Category (L1)"
                      placeholder="Select Category"
                      value={formData.categoryId}
                      options={categories || []}
                      onValueChange={v => setFormData({...formData, categoryId: v, subCategoryId: '', subChildCategoryId: ''})}
                    />

                    <SearchableSingleSelect 
                      label="Sub Category (L2)"
                      placeholder="Select Sub Category"
                      value={formData.subCategoryId}
                      options={availableSubCats}
                      disabled={!formData.categoryId}
                      onValueChange={v => setFormData({...formData, subCategoryId: v, subChildCategoryId: ''})}
                    />

                    <SearchableSingleSelect 
                      label="Sub Child Category (L3)"
                      placeholder="Select Sub Child"
                      value={formData.subChildCategoryId}
                      options={availableChildCats}
                      disabled={!formData.subCategoryId}
                      onValueChange={v => setFormData({...formData, subChildCategoryId: v})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-600 ml-1">Selling Price</Label>
                    <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="h-12 bg-emerald-50/30 border-none rounded-xl font-black text-emerald-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Reg. Price</Label>
                    <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-amber-500 ml-1 flex items-center gap-1">Rating <Star size={10} fill="currentColor" /></Label>
                    <Input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} className="h-12 bg-amber-50/30 border-none rounded-xl font-black text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Team Size</Label>
                    <Input value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: e.target.value})} placeholder="2 Pros" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Duration</Label>
                    <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="3 Hrs" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 text-xs leading-relaxed focus:bg-white transition-all shadow-inner" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100 overflow-hidden">
              <CardHeader className="bg-gray-50/50 p-5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} className="text-primary"/> Optional Add-ons
                </CardTitle>
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">{formData.linkedSubServiceIds?.length || 0} SELECTED</Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col gap-4">
                  <Popover open={isAddonPopoverOpen} onOpenChange={setIsAddonPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "h-12 w-full justify-between rounded-xl border-gray-200 bg-gray-50 text-gray-500 font-bold hover:bg-white",
                        addonSearch && "text-gray-900"
                      )}>
                        {addonSearch || "Search & Select Add-ons..."}
                        <ChevronDown size={16} className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden z-[200]">
                      <div className="flex flex-col">
                        <div className="p-4 border-b bg-gray-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <Input 
                              value={addonSearch} 
                              onChange={e => setAddonSearch(e.target.value)} 
                              placeholder="Type to filter..." 
                              className="h-10 pl-9 bg-white border-none rounded-xl text-xs font-bold"
                            />
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                          {filteredAddonResults.map(s => {
                            const isSelected = formData.linkedSubServiceIds?.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  toggleLinkedAddon(s.id);
                                  setAddonSearch('');
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group",
                                  isSelected ? "bg-primary/5 text-primary" : "hover:bg-gray-50 text-gray-600"
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black uppercase truncate">{s.name}</p>
                                  <p className="text-[9px] font-bold opacity-60">৳{s.price}</p>
                                </div>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                              </button>
                            );
                          })}
                          {filteredAddonResults.length === 0 && (
                            <p className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase">No results found</p>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {selectedAddons.length > 0 && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                      {selectedAddons.map(s => (
                        <Badge 
                          key={s.id} 
                          className="bg-primary/10 text-primary border-none py-1.5 pl-3 pr-2 rounded-xl flex items-center gap-2 group transition-all hover:bg-primary/20"
                        >
                          <span className="text-[10px] font-black uppercase">{s.name}</span>
                          <button 
                            type="button" 
                            onClick={() => toggleLinkedAddon(s.id)}
                            className="p-0.5 hover:bg-white rounded-md text-primary/40 group-hover:text-primary transition-colors"
                          >
                            <X size={10} strokeWidth={3}/>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm rounded-[18px] bg-white border border-gray-100">
                <CardHeader className="bg-emerald-50/30 p-4 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-emerald-700">Included Features</CardTitle>
                  <button type="button" onClick={() => addArrayItem('included')} className="text-emerald-600 hover:scale-110 transition-transform"><Plus size={16}/></button>
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
                  <CardTitle className="text-[10px] font-black uppercase text-blue-700">Work Checklist</CardTitle>
                  <button type="button" onClick={() => addArrayItem('checklist')} className="text-blue-600 hover:scale-110 transition-transform"><Plus size={16}/></button>
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
              <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 w-full md:w-auto">
                 <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Public Deployment</Label>
                 <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="ghost" onClick={() => router.push('/admin/services')} className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400">Discard</Button>
                <Button variant="outline" onClick={() => handleSave('Inactive')} disabled={isSaving} className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200">Draft</Button>
                <Button onClick={() => handleSave()} disabled={isSaving} className="flex-1 md:flex-none h-12 px-12 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} className="mr-2" /> Publish Changes</>}
                </Button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
