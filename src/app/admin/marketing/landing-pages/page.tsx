'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Settings2,
  Wrench,
  ShoppingBag,
  Type,
  ImageIcon,
  Grid
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

export default function LandingPagesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    slug: '',
    type: 'product',
    title: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBadge: 'LIMITED OFFER',
    heroCTA: 'অর্ডার করতে চাই',
    heroBanner: '',
    phone: '01919640422',
    active: true,
    productId: '',
    showCatalogGrid: false,
    catalogSource: 'products',
    catalogTitle: '',
    catalogLimit: 8,
    storageText: '',
    ingredients: [],
    usageTitle: '',
    usageImage: '',
    usagePoints: [],
    trustTitle: '',
    trustPoints: [],
    packages: [],
    addOns: []
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
        title: 'New Landing Page',
        heroTitle: '',
        heroSubtitle: '',
        heroBadge: 'LIMITED OFFER',
        heroCTA: 'অর্ডার করতে চাই',
        heroBanner: '',
        phone: '01919640422',
        active: true,
        productId: '',
        showCatalogGrid: false,
        catalogSource: 'products',
        catalogTitle: '',
        catalogLimit: 8,
        storageText: '',
        ingredients: [],
        usageTitle: '',
        usageImage: '',
        usagePoints: [],
        trustTitle: '',
        trustPoints: [],
        packages: [],
        addOns: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const slug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = { ...formData, slug, updatedAt: new Date().toISOString() };

    try {
      if (editingPage) {
        await updateDoc(doc(db, 'landing_pages', editingPage.id), data);
        toast({ title: "Landing Page Updated" });
      } else {
        await addDoc(collection(db, 'landing_pages'), { ...data, createdAt: new Date().toISOString() });
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Universal Page Builder</h1>
          <p className="text-muted-foreground text-sm font-medium">Create high-converting landing pages with dynamic catalog sync</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> Create New Page
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
                  {page.type === 'service' ? <Wrench size={20} /> : <ShoppingBag size={20} />}
                </div>
                <Badge variant="secondary" className="text-[8px] font-black uppercase">{page.type}</Badge>
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
        <DialogContent className="max-w-5xl w-[95vw] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className={cn("p-8 text-white shrink-0", formData.type === 'service' ? "bg-[#1E5F7A]" : "bg-[#8B0000]")}>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Sparkles className="text-yellow-400" /> {editingPage ? 'Update Landing Page' : 'New Page Design'}
                </DialogTitle>
                <div className="flex items-center gap-3 bg-white/10 p-1 rounded-xl">
                  <button type="button" onClick={() => setFormData({...formData, type: 'product'})} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", formData.type === 'product' ? "bg-white text-red-600 shadow-sm" : "text-white/60 hover:text-white")}>Product Sales</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'service'})} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", formData.type === 'service' ? "bg-white text-blue-600 shadow-sm" : "text-white/60 hover:text-white")}>Service Booking</button>
                </div>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="hero" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-gray-100 rounded-none h-12 p-0 flex justify-start px-8 gap-8 border-b overflow-x-auto no-scrollbar">
                <TabsTrigger value="hero" className="text-[9px] font-black uppercase">Hero & Logic</TabsTrigger>
                <TabsTrigger value="catalog" className="text-[9px] font-black uppercase">Live Catalog Sync</TabsTrigger>
                <TabsTrigger value="ingredients" className="text-[9px] font-black uppercase">Additional Info</TabsTrigger>
                <TabsTrigger value="usage" className="text-[9px] font-black uppercase">Usage & Trust</TabsTrigger>
                <TabsTrigger value="pricing" className="text-[9px] font-black uppercase">Packages & Add-ons</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                
                <TabsContent value="hero" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <ImageUploader label="Hero Banner Image" initialUrl={formData.heroBanner} onUpload={url => setFormData({...formData, heroBanner: url})} aspectRatio="aspect-video" />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Internal Identification</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">URL Slug</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary">Hero Headline</Label>
                        <Input value={formData.heroTitle} onChange={e => setFormData({...formData, heroTitle: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hero Subtitle</Label>
                        <Textarea value={formData.heroSubtitle} onChange={e => setFormData({...formData, heroSubtitle: e.target.value})} className="bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">CTA Button</Label>
                          <Input value={formData.heroCTA} onChange={e => setFormData({...formData, heroCTA: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Hotline</Label>
                          <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="catalog" className="space-y-8 mt-0">
                  <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary text-white rounded-2xl shadow-lg"><Grid size={24} /></div>
                        <div>
                          <h3 className="font-black uppercase tracking-tight">Live Inventory Sync</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Fetch items directly from main site</p>
                        </div>
                      </div>
                      <Switch checked={formData.showCatalogGrid} onCheckedChange={v => setFormData({...formData, showCatalogGrid: v})} />
                    </div>
                    {formData.showCatalogGrid && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t animate-in fade-in">
                        <Select value={formData.catalogSource} onValueChange={v => setFormData({...formData, catalogSource: v})}>
                          <SelectTrigger className="h-12 bg-white border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="products">Products</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={formData.catalogTitle} onChange={e => setFormData({...formData, catalogTitle: e.target.value})} className="h-12 bg-white border-none rounded-xl" placeholder="Section Title" />
                        <Input type="number" value={formData.catalogLimit} onChange={e => setFormData({...formData, catalogLimit: parseInt(e.target.value) || 8})} className="h-12 bg-white border-none rounded-xl" />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-10 mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-black uppercase text-primary">Price Package Bundles</Label>
                      <Button type="button" size="sm" onClick={() => addArrayItem('packages', { name: '', price: 0, originalPrice: 0 })} variant="outline"><Plus size={14} /> Add Bundle</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {formData.packages?.map((pkg: any, i: number) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative">
                          <Input value={pkg.name} onChange={e => {
                            const list = [...formData.packages];
                            list[i].name = e.target.value;
                            setFormData({...formData, packages: list});
                          }} className="h-10 bg-white" placeholder="Label (e.g. 500gm)" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="number" value={pkg.price} onChange={e => {
                              const list = [...formData.packages];
                              list[i].price = parseInt(e.target.value) || 0;
                              setFormData({...formData, packages: list});
                            }} className="h-10 bg-white" placeholder="Sale Price" />
                            <Input type="number" value={pkg.originalPrice} onChange={e => {
                              const list = [...formData.packages];
                              list[i].originalPrice = parseInt(e.target.value) || 0;
                              setFormData({...formData, packages: list});
                            }} className="h-10 bg-white" placeholder="Regular Price" />
                          </div>
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('packages', i)}><Trash2 size={14} /></Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.type === 'service' && (
                    <div className="space-y-6 border-t pt-10">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-black uppercase text-blue-600">Add-on Services (Optional)</Label>
                        <Button type="button" size="sm" onClick={() => addArrayItem('addOns', { name: '', price: 0 })} variant="outline" className="text-blue-600 border-blue-200"><Plus size={14} /> Add Option</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formData.addOns?.map((add: any, i: number) => (
                          <div key={i} className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-4 relative">
                            <Input value={add.name} onChange={e => {
                              const list = [...formData.addOns];
                              list[i].name = e.target.value;
                              setFormData({...formData, addOns: list});
                            }} className="h-10 bg-white" placeholder="Task Name" />
                            <Input type="number" value={add.price} onChange={e => {
                              const list = [...formData.addOns];
                              list[i].price = parseInt(e.target.value) || 0;
                              setFormData({...formData, addOns: list});
                            }} className="h-10 bg-white" placeholder="+ Extra Charge" />
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('addOns', i)}><Trash2 size={14} /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-6 mt-0">
                  <Button type="button" size="sm" onClick={() => addArrayItem('ingredients', { name: '', image: '' })} variant="outline">Add Item</Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.ingredients?.map((s: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 relative">
                        <ImageUploader initialUrl={s.image} onUpload={url => {
                          const list = [...formData.ingredients];
                          list[i].image = url;
                          setFormData({...formData, ingredients: list});
                        }} aspectRatio="aspect-square w-16" />
                        <Input placeholder="Name" value={s.name} onChange={e => {
                          const list = [...formData.ingredients];
                          list[i].name = e.target.value;
                          setFormData({...formData, ingredients: list});
                        }} className="h-11 bg-white" />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive" onClick={() => removeArrayItem('ingredients', i)}><X size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <Label className="text-xs font-black uppercase text-primary">Usage Section</Label>
                      <Input placeholder="Section Title" value={formData.usageTitle} onChange={e => setFormData({...formData, usageTitle: e.target.value})} className="h-12 bg-gray-50 border-none" />
                      <ImageUploader label="Usage Image" initialUrl={formData.usageImage} onUpload={url => setFormData({...formData, usageImage: url})} />
                      <div className="space-y-2">
                        {formData.usagePoints?.map((p: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <Input value={p} onChange={e => {
                              const list = [...formData.usagePoints];
                              list[i] = e.target.value;
                              setFormData({...formData, usagePoints: list});
                            }} className="h-10 bg-gray-50 border-none" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('usagePoints', i)}><X size={14} /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="link" size="sm" onClick={() => addArrayItem('usagePoints', '')}>+ Add Point</Button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <Label className="text-xs font-black uppercase text-primary">Trust Section</Label>
                      <Input placeholder="Trust Title" value={formData.trustTitle} onChange={e => setFormData({...formData, trustTitle: e.target.value})} className="h-12 bg-gray-50 border-none" />
                      <div className="space-y-2">
                        {formData.trustPoints?.map((p: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <Input value={p} onChange={e => {
                              const list = [...formData.trustPoints];
                              list[i] = e.target.value;
                              setFormData({...formData, trustPoints: list});
                            }} className="h-10 bg-gray-50 border-none" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('trustPoints', i)}><X size={14} /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="link" size="sm" onClick={() => addArrayItem('trustPoints', '')}>+ Add Point</Button>
                      </div>
                      <Textarea placeholder="Storage Info" value={formData.storageText} onChange={e => setFormData({...formData, storageText: e.target.value})} className="min-h-[100px]" />
                    </div>
                  </div>
                </TabsContent>

              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <div className="flex items-center gap-4 w-full">
                <Switch checked={formData.active} onCheckedChange={v => setFormData({...formData, active: v})} />
                <Label>Active</Label>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className={cn("px-12 h-14", formData.type === 'service' ? "bg-blue-600" : "bg-red-600")}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2" />}
                  Deploy Page
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}