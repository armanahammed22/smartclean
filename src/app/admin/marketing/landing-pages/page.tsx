
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
  Type
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
    type: 'product', // 'product' | 'service'
    title: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBadge: 'LIMITED OFFER',
    phone: '01919640422',
    active: true,
    productId: '',
    storageText: '',
    ingredients: [],
    usageTitle: '',
    usageImage: '',
    usagePoints: [],
    trustTitle: '',
    trustPoints: [],
    packages: []
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
        phone: '01919640422',
        active: true,
        productId: '',
        storageText: '',
        ingredients: [],
        usageTitle: '',
        usageImage: '',
        usagePoints: [],
        trustTitle: '',
        trustPoints: [],
        packages: []
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
          <p className="text-muted-foreground text-sm font-medium">Create high-converting landing pages for Products or Services</p>
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
                <TabsTrigger value="ingredients" className="text-[9px] font-black uppercase">{formData.type === 'service' ? 'Service List' : 'Ingredients List'}</TabsTrigger>
                <TabsTrigger value="usage" className="text-[9px] font-black uppercase">Usage & Trust</TabsTrigger>
                <TabsTrigger value="pricing" className="text-[9px] font-black uppercase">Pricing Packages</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                
                {/* TAB: HERO */}
                <TabsContent value="hero" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Internal Page Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">URL Slug (Unique)</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono" />
                      </div>
                      {formData.type === 'product' && (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Linked Inventory Product</Label>
                          <Select value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})}>
                            <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Product" /></SelectTrigger>
                            <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hero Headline (Bangla)</Label>
                        <Input value={formData.heroTitle} onChange={e => setFormData({...formData, heroTitle: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hero Subtitle</Label>
                        <Input value={formData.heroSubtitle} onChange={e => setFormData({...formData, heroSubtitle: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hotline Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: INGREDIENTS / SERVICES */}
                <TabsContent value="ingredients" className="space-y-6 mt-0">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase">{formData.type === 'service' ? 'Sub-Services Offered' : 'Ingredients List (The Grid)'}</Label>
                    <Button type="button" size="sm" onClick={() => addArrayItem('ingredients', { name: '', image: '' })} variant="outline"><Plus size={14} /> Add Item</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.ingredients?.map((s: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 relative">
                        <ImageUploader initialUrl={s.image} onUpload={url => {
                          const list = [...formData.ingredients];
                          list[i].image = url;
                          setFormData({...formData, ingredients: list});
                        }} aspectRatio="aspect-square w-16" />
                        <Input placeholder="Label Name" value={s.name} onChange={e => {
                          const list = [...formData.ingredients];
                          list[i].name = e.target.value;
                          setFormData({...formData, ingredients: list});
                        }} className="h-11 bg-white" />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => removeArrayItem('ingredients', i)}><X size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* TAB: USAGE & TRUST */}
                <TabsContent value="usage" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">{formData.type === 'service' ? 'Service Benefits' : 'Usage Section'}</Label>
                      <Input placeholder="Section Title" value={formData.usageTitle} onChange={e => setFormData({...formData, usageTitle: e.target.value})} className="h-11 font-bold" />
                      <ImageUploader label="Section Image" initialUrl={formData.usageImage} onUpload={url => setFormData({...formData, usageImage: url})} />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">Bullet Points</Label>
                        {formData.usagePoints?.map((p: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <Input value={p} onChange={e => {
                              const list = [...formData.usagePoints];
                              list[i] = e.target.value;
                              setFormData({...formData, usagePoints: list});
                            }} className="h-9" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('usagePoints', i)}><X size={14} /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="link" size="sm" onClick={() => addArrayItem('usagePoints', '')} className="text-[10px] uppercase font-black">+ Add Point</Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">Trust Section</Label>
                      <Input placeholder="Section Title" value={formData.trustTitle} onChange={e => setFormData({...formData, trustTitle: e.target.value})} className="h-11 font-bold" />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">Why Choose Us Points</Label>
                        {formData.trustPoints?.map((p: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <Input value={p} onChange={e => {
                              const list = [...formData.trustPoints];
                              list[i] = e.target.value;
                              setFormData({...formData, trustPoints: list});
                            }} className="h-9" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('trustPoints', i)}><X size={14} /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="link" size="sm" onClick={() => addArrayItem('trustPoints', '')} className="text-[10px] uppercase font-black">+ Add Point</Button>
                      </div>
                      {formData.type === 'product' && (
                        <div className="space-y-2 pt-4">
                          <Label className="text-xs font-black uppercase">Storage Info Box</Label>
                          <Textarea value={formData.storageText} onChange={e => setFormData({...formData, storageText: e.target.value})} className="min-h-[100px] bg-gray-50" />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: PRICING */}
                <TabsContent value="pricing" className="space-y-6 mt-0">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase">Pricing Packages</Label>
                    <Button type="button" size="sm" onClick={() => addArrayItem('packages', { name: '', price: 0, originalPrice: 0 })} variant="outline"><Plus size={14} /> Add Package</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.packages?.map((pkg: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 relative">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-40">Package Name</Label>
                          <Input value={pkg.name} onChange={e => {
                            const list = [...formData.packages];
                            list[i].name = e.target.value;
                            setFormData({...formData, packages: list});
                          }} className="h-10 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">Sales Price</Label>
                            <Input type="number" value={pkg.price} onChange={e => {
                              const list = [...formData.packages];
                              list[i].price = parseInt(e.target.value) || 0;
                              setFormData({...formData, packages: list});
                            }} className="h-10 font-black text-primary" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">Old Price</Label>
                            <Input type="number" value={pkg.originalPrice} onChange={e => {
                              const list = [...formData.packages];
                              list[i].originalPrice = parseInt(e.target.value) || 0;
                              setFormData({...formData, packages: list});
                            }} className="h-10 text-gray-400 line-through" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive" onClick={() => removeArrayItem('packages', i)}><Trash2 size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className={cn("rounded-xl font-black px-10 h-12 text-white shadow-xl uppercase tracking-tighter", formData.type === 'service' ? "bg-blue-600" : "bg-red-600")}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                {editingPage ? 'Sync Updates' : 'Launch Design'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
