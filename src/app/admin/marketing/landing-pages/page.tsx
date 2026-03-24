
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  ExternalLink,
  Zap,
  Sparkles,
  X,
  Layout,
  Layers,
  Wrench,
  ShoppingBag,
  Grid,
  CheckCircle2,
  Package,
  Settings2,
  Box,
  ClipboardList,
  Target,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NextImage from 'next/image';

export default function RebuiltLandingPageAdmin() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  // Unified Form State
  const [formData, setFormData] = useState<any>({
    slug: '',
    type: 'product',
    title: 'New Page',
    active: true,
    bannerImage: '',
    heroTitle: '',
    heroSubtitle: '',
    phone: '01919640422',
    
    featuresTitle: 'কেন এটি আপনার জন্য সেরা?',
    features: [],
    
    detailsTitle: 'বিস্তারিত তথ্য',
    detailsText: '',
    detailsImage: '',
    
    whyTitle: 'আমাদের ওপর কেন আস্থা রাখবেন?',
    whyItems: ['১০০% অরিজিনাল পণ্য', 'সারা বাংলাদেশে ডেলিভারি', '৭ দিনের রিটার্ন সুবিধা', 'নিরাপদ পেমেন্ট', '২৪/৭ সাপোর্ট'],
    
    discountValue: 0,
    discountType: 'fixed',
    
    // Product Mode
    productIds: [], // Used for both modes' 8-item grid
    deliveryCharge: 60,
    
    // Service Mode
    serviceId: '',
    serviceImage: '',
    packages: [],
    addOns: [],
    additionalCharge: 0
  });

  const pagesQuery = useMemoFirebase(() => db ? query(collection(db, 'landing_pages'), orderBy('createdAt', 'desc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

  const { data: pages, isLoading } = useCollection(pagesQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);

  const handleOpenDialog = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({ ...formData, ...page });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
        type: 'product',
        title: 'New Landing Page',
        active: true,
        bannerImage: '',
        heroTitle: '',
        heroSubtitle: '',
        phone: '01919640422',
        featuresTitle: 'কেন এটি আপনার জন্য সেরা?',
        features: [],
        detailsTitle: 'বিস্তারিত তথ্য',
        detailsText: '',
        detailsImage: '',
        whyTitle: 'আমাদের ওপর কেন আস্থা রাখবেন?',
        whyItems: ['১০০% অরিজিনাল পণ্য', 'সারা বাংলাদেশে ডেলিভারি', '৭ দিনের রিটার্ন সুবিধা', 'নিরাপদ পেমেন্ট', '২৪/৭ সাপোর্ট'],
        discountValue: 0,
        discountType: 'fixed',
        productIds: [],
        deliveryCharge: 60,
        serviceId: '',
        serviceImage: '',
        packages: [],
        addOns: [],
        additionalCharge: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const slug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const finalData = {
      ...formData,
      slug,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPage) {
        await updateDoc(doc(db, 'landing_pages', editingPage.id), finalData);
        toast({ title: "Page Configuration Saved" });
      } else {
        await addDoc(collection(db, 'landing_pages'), { ...finalData, createdAt: new Date().toISOString() });
        toast({ title: "Landing Page Created" });
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addArrayItem = (field: string, item: any) => setFormData({ ...formData, [field]: [...(formData[field] || []), item] });
  const removeArrayItem = (field: string, index: number) => {
    const list = [...formData[field]];
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  const toggleGridProduct = (id: string) => {
    const current = [...(formData.productIds || [])];
    if (current.includes(id)) {
      setFormData({...formData, productIds: current.filter(i => i !== id)});
    } else if (current.length < 8) {
      setFormData({...formData, productIds: [...current, id]});
    } else {
      toast({ title: "Limit Reached", description: "You can select max 8 items." });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Landing Page Builder</h1>
          <p className="text-muted-foreground text-sm font-medium">Build high-conversion funnels for Products or Services</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Page Engine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : pages?.map((page) => (
          <Card key={page.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100", !page.active && "opacity-60 grayscale")}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-xl", page.type === 'service' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600")}>
                  {page.type === 'service' ? <Wrench size={20} /> : <Box size={20} />}
                </div>
                <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                  {page.type === 'service' ? 'Booking Portal' : 'Sales Funnel'}
                </Badge>
              </div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm line-clamp-1">{page.title}</h3>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-[10px] font-mono text-primary font-bold">/{page.slug}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild><Link href={`/${page.slug}`} target="_blank"><ExternalLink size={14} /></Link></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDialog(page)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'landing_pages', page.id))}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            
            <header className={cn("p-8 text-white shrink-0 transition-colors", formData.type === 'service' ? "bg-blue-600" : "bg-[#D60000]")}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    {editingPage ? 'Update Landing Page' : 'Initialize New Engine'}
                  </DialogTitle>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Configure independent behavioral logic</p>
                </div>
                <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <button type="button" onClick={() => setFormData({...formData, type: 'product'})} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", formData.type === 'product' ? "bg-white text-[#D60000] shadow-xl" : "text-white/60 hover:text-white")}>
                    <ShoppingBag size={14} /> Product Mode
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'service'})} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", formData.type === 'service' ? "bg-white text-blue-600 shadow-xl" : "text-white/60 hover:text-white")}>
                    <ClipboardList size={14} /> Service Mode
                  </button>
                </div>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="max-w-5xl mx-auto space-y-12">
                
                {/* 1. IDENTITY & HERO */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2"><Layout size={14} /> Basic Identity & Hero</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Page Title</Label>
                      <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">URL Slug</Label>
                      <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono text-primary font-bold" required />
                    </div>
                    <div className="md:col-span-2">
                      <ImageUploader label="Hero Banner (1200x400)" initialUrl={formData.bannerImage} onUpload={url => setFormData({...formData, bannerImage: url})} aspectRatio="aspect-[21/7]" />
                    </div>
                  </div>
                </section>

                {/* 2. DYNAMIC HERO GRID (8 Items) */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2"><Grid size={14} /> Hero Below Grid (Max 8 Items)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    {(formData.type === 'service' ? services : products)?.slice(0, 32).map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleGridProduct(item.id)}
                        className={cn(
                          "relative aspect-square rounded-xl border-2 cursor-pointer overflow-hidden transition-all group",
                          formData.productIds?.includes(item.id) ? "border-primary ring-2 ring-primary/20" : "border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                        )}
                      >
                        <NextImage src={item.imageUrl} alt="Select" fill className="object-cover" unoptimized />
                        {formData.productIds?.includes(item.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Badge className="bg-primary text-white text-[8px]">{formData.productIds.indexOf(item.id) + 1}</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Click to select items for the 8-item hero grid. Selection sequence determines order.</p>
                </section>

                {/* 3. MODE SPECIFIC CONFIG */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2"><Target size={14} /> {formData.type === 'product' ? 'Inventory & Pricing' : 'Packages & Add-ons'}</h3>
                  
                  {formData.type === 'product' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-red-50/50 p-8 rounded-[2rem] border border-red-100">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Sync Inventory (Main Item)</Label>
                        <Select value={formData.serviceId} onValueChange={v => setFormData({...formData, serviceId: v})}>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Search product..." /></SelectTrigger>
                          <SelectContent>
                            {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Delivery Charge (BDT)</Label>
                        <Input type="number" value={formData.deliveryCharge} onChange={e => setFormData({...formData, deliveryCharge: parseFloat(e.target.value) || 0})} className="h-12 bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10 bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="font-black text-xs uppercase">Booking Packages</Label>
                          <Button type="button" size="sm" onClick={() => addArrayItem('packages', { id: Math.random().toString(36).substr(2, 9), name: '', price: 0, features: [], isDefault: false })}><Plus size={14} /> Add Package</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {formData.packages?.map((pkg: any, idx: number) => (
                            <div key={pkg.id} className="p-6 bg-white rounded-2xl border flex gap-6 items-start relative">
                              <Input placeholder="Package Name" value={pkg.name} onChange={e => {
                                const list = [...formData.packages];
                                list[idx].name = e.target.value;
                                setFormData({...formData, packages: list});
                              }} className="flex-1 h-10" />
                              <Input type="number" placeholder="Price" value={pkg.price} onChange={e => {
                                const list = [...formData.packages];
                                list[idx].price = parseFloat(e.target.value) || 0;
                                setFormData({...formData, packages: list});
                              }} className="w-24 h-10" />
                              <div className="flex items-center gap-2 pt-2">
                                <Label className="text-[10px] font-black">Default</Label>
                                <Switch checked={pkg.isDefault} onCheckedChange={val => {
                                  const list = formData.packages.map((p: any, i: number) => ({ ...p, isDefault: i === idx ? val : false }));
                                  setFormData({...formData, packages: list});
                                }} />
                              </div>
                              <button type="button" onClick={() => removeArrayItem('packages', idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 border-t border-blue-100 pt-8">
                        <div className="flex justify-between items-center">
                          <Label className="font-black text-xs uppercase">Add-on Services (Image Required)</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('addOns', { id: Math.random().toString(36).substr(2, 9), name: '', price: 0, imageUrl: '', enabled: true })}><Plus size={14} /> Add New Add-on</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.addOns?.map((add: any, idx: number) => (
                            <div key={add.id} className="p-4 bg-white rounded-2xl border border-gray-100 space-y-4 relative group">
                              <div className="flex gap-4">
                                <ImageUploader initialUrl={add.imageUrl} onUpload={(url) => {
                                  const list = [...formData.addOns];
                                  list[idx].imageUrl = url;
                                  setFormData({...formData, addOns: list});
                                }} aspectRatio="aspect-square w-16" label="Icon" />
                                <div className="flex-1 space-y-3">
                                  <Input placeholder="Service Name" value={add.name} onChange={e => {
                                    const list = [...formData.addOns];
                                    list[idx].name = e.target.value;
                                    setFormData({...formData, addOns: list});
                                  }} className="h-9 font-bold" />
                                  <div className="flex gap-2">
                                    <Input type="number" placeholder="Price" value={add.price} onChange={e => {
                                      const list = [...formData.addOns];
                                      list[idx].price = parseFloat(e.target.value) || 0;
                                      setFormData({...formData, addOns: list});
                                    }} className="h-9 flex-1" />
                                    <div className="flex items-center gap-2 bg-gray-50 px-2 rounded-lg">
                                      <Label className="text-[8px] font-black uppercase">Active</Label>
                                      <Switch checked={add.enabled} onCheckedChange={val => {
                                        const list = [...formData.addOns];
                                        list[idx].enabled = val;
                                        setFormData({...formData, addOns: list});
                                      }} className="scale-75" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeArrayItem('addOns', idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* 4. SHARED UI: DETAILS & WHY */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Why Choose Us (List)</h3>
                    <div className="space-y-2">
                      {formData.whyItems?.map((item: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={item} onChange={e => {
                            const list = [...formData.whyItems];
                            list[idx] = e.target.value;
                            setFormData({...formData, whyItems: list});
                          }} className="h-10 bg-gray-50" />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('whyItems', idx)}><Trash2 size={14} /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-10" onClick={() => addArrayItem('whyItems', '')}><Plus size={14} /> Add Item</Button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Details Section</h3>
                    <div className="space-y-4">
                      <Input placeholder="Section Title" value={formData.detailsTitle} onChange={e => setFormData({...formData, detailsTitle: e.target.value})} className="h-12 bg-gray-50" />
                      <Textarea placeholder="Content text" value={formData.detailsText} onChange={e => setFormData({...formData, detailsText: e.target.value})} className="min-h-[150px] bg-gray-50" />
                      <ImageUploader label="Section Image" initialUrl={formData.detailsImage} onUpload={url => setFormData({...formData, detailsImage: url})} />
                    </div>
                  </div>
                </section>

              </div>
            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <div className="flex items-center gap-4 w-full">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border">
                  <Switch checked={formData.active} onCheckedChange={v => setFormData({...formData, active: v})} />
                  <Label className="text-[10px] font-black uppercase">Live Active</Label>
                </div>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold px-8">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className={cn("rounded-xl font-black px-12 h-14 shadow-xl text-white", formData.type === 'service' ? "bg-blue-600" : "bg-[#D60000]")}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2" />}
                  Deploy Landing Page
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
