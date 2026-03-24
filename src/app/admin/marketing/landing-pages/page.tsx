
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
  ClipboardList
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

const PACKAGE_NAME_SUGGESTIONS: Record<string, string[]> = {
  'Routine Maintenance': ['Essential Clean', 'Classic Clean', 'Weekly Refresh', 'Standard Maintenance'],
  'Deep Cleaning': ['Deep Clean', 'Deluxe Cleaning', 'Total Transformation', 'Intensive Scrub', 'Restorative Cleaning'],
  'Specialized': ['Move-In/Move-Out', 'Spring/Fall Deep Clean', 'Post-Construction', 'Vacation Rental Prep', 'Spring Cleaning'],
  'Commercial/Office': ['Office Sparkle', 'Executive Suite Package', 'Facility Care Plan', 'Commercial Maintenance']
};

export default function LandingPagesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  // Default state for a NEW page
  const [formData, setFormData] = useState<any>({
    slug: '',
    type: 'product', // 'product' | 'service'
    title: '',
    active: true,
    
    // PRODUCT MODE FIELDS
    productId: '',
    showCatalogGrid: false,
    catalogSource: 'products',
    catalogTitle: 'More Items',
    catalogLimit: 8,

    // SERVICE MODE FIELDS
    heroTitle: '',
    heroSubtitle: '',
    heroBanner: '',
    phone: '01919640422',
    packages: [],
    addOns: [],
    usageTitle: 'How we work',
    usagePoints: [],
    trustTitle: 'Why trust us',
    trustPoints: []
  });

  const pagesQuery = useMemoFirebase(() => db ? query(collection(db, 'landing_pages'), orderBy('createdAt', 'desc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);

  const { data: pages, isLoading } = useCollection(pagesQuery);
  const { data: products } = useCollection(productsQuery);

  const handleOpenDialog = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({ ...formData, ...page });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
        type: 'product',
        title: 'New Page',
        active: true,
        productId: '',
        showCatalogGrid: false,
        catalogSource: 'products',
        catalogTitle: 'More Items',
        catalogLimit: 8,
        heroTitle: '',
        heroSubtitle: '',
        heroBanner: '',
        phone: '01919640422',
        packages: [],
        addOns: [],
        usageTitle: 'How we work',
        usagePoints: [],
        trustTitle: 'Why trust us',
        trustPoints: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const slug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Strict separation: Filter data based on type before saving
    let finalData: any = {
      slug,
      type: formData.type,
      title: formData.title,
      active: formData.active,
      updatedAt: new Date().toISOString()
    };

    if (formData.type === 'product') {
      finalData = {
        ...finalData,
        productId: formData.productId,
        showCatalogGrid: formData.showCatalogGrid,
        catalogSource: formData.catalogSource,
        catalogTitle: formData.catalogTitle,
        catalogLimit: formData.catalogLimit
      };
    } else {
      finalData = {
        ...finalData,
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        heroBanner: formData.heroBanner,
        phone: formData.phone,
        packages: formData.packages,
        addOns: formData.addOns,
        usageTitle: formData.usageTitle,
        usagePoints: formData.usagePoints,
        trustTitle: formData.trustTitle,
        trustPoints: formData.trustPoints
      };
    }

    try {
      if (editingPage) {
        await updateDoc(doc(db, 'landing_pages', editingPage.id), finalData);
        toast({ title: "Landing Page Updated" });
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

  const updatePackage = (index: number, field: string, value: any) => {
    const list = [...formData.packages];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, packages: list });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground text-sm font-medium">Create independent Product Sales or Service Booking pages</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> Add New Landing Page
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
                  {page.type === 'service' ? 'Service Booking' : 'Product Sales'}
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
            
            {/* MODE SELECTION HEADER */}
            <header className={cn("p-8 text-white shrink-0 transition-colors", formData.type === 'service' ? "bg-blue-600" : "bg-red-600")}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    {editingPage ? 'Edit Dynamic Page' : 'New Page Engine'}
                  </DialogTitle>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Configure independent behavioral logic</p>
                </div>
                <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'product'})} 
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2",
                      formData.type === 'product' ? "bg-white text-red-600 shadow-xl" : "text-white/60 hover:text-white"
                    )}
                  >
                    <Box size={14} /> Product Sales
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'service'})} 
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2",
                      formData.type === 'service' ? "bg-white text-blue-600 shadow-xl" : "text-white/60 hover:text-white"
                    )}
                  >
                    <ClipboardList size={14} /> Service Booking
                  </button>
                </div>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="max-w-5xl mx-auto space-y-10">
                
                {/* 1. SHARED CONFIG */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Global Identity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Internal Page Title</Label>
                      <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">URL Slug (Instant Activation)</Label>
                      <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono text-primary font-bold" required />
                    </div>
                  </div>
                </section>

                {/* 2. MODE SPECIFIC LOGIC */}
                {formData.type === 'product' ? (
                  <div className="space-y-10 animate-in fade-in zoom-in-95">
                    {/* PRODUCT MODE UI */}
                    <Card className="border-none shadow-sm bg-red-50/50 rounded-3xl overflow-hidden border-2 border-red-100">
                      <CardHeader className="bg-red-600 text-white p-6">
                        <CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Package size={16}/> Inventory Integration</CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Select Primary Product (Live Sync)</Label>
                          <Select value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})}>
                            <SelectTrigger className="h-12 bg-white border-none rounded-xl font-bold">
                              <SelectValue placeholder="Search inventory..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border">
                          <div className="space-y-1">
                            <Label className="text-xs font-black uppercase text-red-900">Dynamic Catalog Grid</Label>
                            <p className="text-[9px] font-bold text-red-700/60 uppercase">Show related items from database</p>
                          </div>
                          <Switch checked={formData.showCatalogGrid} onCheckedChange={v => setFormData({...formData, showCatalogGrid: v})} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in zoom-in-95">
                    {/* SERVICE MODE UI */}
                    <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl overflow-hidden border-2 border-blue-100">
                      <CardHeader className="bg-blue-600 text-white p-6">
                        <CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Wrench size={16}/> Service Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <ImageUploader label="Custom Hero Banner" initialUrl={formData.heroBanner} onUpload={url => setFormData({...formData, heroBanner: url})} aspectRatio="aspect-video" />
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Hero Headline</Label>
                              <Input value={formData.heroTitle} onChange={e => setFormData({...formData, heroTitle: e.target.value})} className="h-12 bg-white" />
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Booking Subtitle</Label>
                              <Textarea value={formData.heroSubtitle} onChange={e => setFormData({...formData, heroSubtitle: e.target.value})} className="min-h-[100px] bg-white" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Official Hotline</Label>
                              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-white" />
                            </div>
                          </div>
                        </div>

                        {/* PACKAGES SYSTEM */}
                        <div className="space-y-6 pt-8 border-t">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-900">Package Bundles</h4>
                            <Button type="button" onClick={() => addArrayItem('packages', { id: Math.random().toString(36).substr(2, 9), category: 'Routine Maintenance', name: '', price: 0, description: '', features: [], status: true })} className="h-8 text-[9px] bg-blue-600 rounded-lg">Add Package</Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {formData.packages?.map((pkg: any, idx: number) => (
                              <div key={pkg.id} className="p-6 bg-white rounded-2xl border border-blue-100 relative group">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <Select value={pkg.category} onValueChange={v => updatePackage(idx, 'category', v)}>
                                    <SelectTrigger className="h-10 bg-gray-50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Object.keys(PACKAGE_NAME_SUGGESTIONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Input value={pkg.name} onChange={e => updatePackage(idx, 'name', e.target.value)} placeholder="Package Name" className="h-10" />
                                  <Input type="number" value={pkg.price} onChange={e => updatePackage(idx, 'price', parseInt(e.target.value))} placeholder="Price" className="h-10 font-black text-blue-600" />
                                </div>
                                <button type="button" onClick={() => removeArrayItem('packages', idx)} className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <div className="flex items-center gap-4 w-full">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                  <Switch checked={formData.active} onCheckedChange={v => setFormData({...formData, active: v})} />
                  <Label className="text-[10px] font-black uppercase">Live Active</Label>
                </div>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold px-8">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className={cn("rounded-xl font-black px-12 h-14 shadow-xl transition-all", formData.type === 'service' ? "bg-blue-600" : "bg-red-600")}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2" />}
                  Deploy {formData.type === 'service' ? 'Booking' : 'Sales'} Page
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
