
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Globe, 
  ExternalLink,
  Zap,
  Sparkles,
  Video,
  X,
  Wrench,
  Package,
  ImageIcon,
  Layout,
  Layers,
  Settings2
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
    type: 'service',
    title: '',
    heroTitle: '',
    heroSubtitle: '',
    description: '',
    price: 0,
    discountPrice: 0,
    imageUrl: '',
    bannerImage: '',
    useCustomBanner: false,
    videoUrl: '',
    active: true,
    phone: '01919640422',
    productId: '',
    stockText: 'অফারটি সীমিত সময়ের জন্য',
    floatingServices: [],
    includingItems: [],
    detailsContent: { text: '', features: [] },
    pricingCategories: []
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
        type: 'service',
        title: 'New Cleaning Service Page',
        heroTitle: '',
        heroSubtitle: '',
        description: '',
        price: 0,
        discountPrice: 0,
        imageUrl: '',
        bannerImage: '',
        useCustomBanner: false,
        videoUrl: '',
        active: true,
        phone: '01919640422',
        productId: '',
        stockText: 'অফারটি সীমিত সময়ের জন্য',
        floatingServices: [],
        includingItems: [],
        detailsContent: { text: '', features: [] },
        pricingCategories: []
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

  // Helper functions to manage arrays in form
  const addItem = (field: string, item: any) => setFormData({ ...formData, [field]: [...(formData[field] || []), item] });
  const removeItem = (field: string, index: number) => {
    const list = [...formData[field]];
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Advanced Page Manager</h1>
          <p className="text-muted-foreground text-sm font-medium">Create high-converting landing pages for your services</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Sales Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : pages?.map((page) => (
          <Card key={page.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100", !page.active && "opacity-60 grayscale")}>
            <div className="aspect-[21/9] relative bg-gray-50 border-b">
              <img src={page.bannerImage || page.imageUrl || 'https://picsum.photos/seed/lp/800/400'} alt={page.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={cn(page.type === 'product' ? "bg-red-600" : "bg-blue-600", "text-white border-none uppercase font-black text-[8px]")}>{page.type?.toUpperCase()}</Badge>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
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
            <DialogHeader className={cn("p-8 text-white shrink-0", formData.type === 'product' ? "bg-[#8B0000]" : "bg-[#081621]")}>
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Sparkles className="text-[#FFD700]" /> {editingPage ? 'Update Landing Page' : 'New Page Design'}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="hero" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-gray-100 rounded-none h-12 p-0 flex justify-start px-8 gap-8 border-b overflow-x-auto no-scrollbar">
                <TabsTrigger value="hero" className="text-[9px] font-black uppercase">Hero Section</TabsTrigger>
                <TabsTrigger value="hub" className="text-[9px] font-black uppercase">Service Hub</TabsTrigger>
                <TabsTrigger value="including" className="text-[9px] font-black uppercase">Including Section</TabsTrigger>
                <TabsTrigger value="details" className="text-[9px] font-black uppercase">Detailed Info</TabsTrigger>
                <TabsTrigger value="pricing" className="text-[9px] font-black uppercase">Pricing Matrix</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                
                {/* TAB: HERO */}
                <TabsContent value="hero" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Page Content Strategy</Label>
                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Service Booking (Teal/Blue)</SelectItem>
                            <SelectItem value="product">Product Sale (Red/Yellow)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ImageUploader label="Dynamic Banner Image" initialUrl={formData.bannerImage} onUpload={url => setFormData({...formData, bannerImage: url, useCustomBanner: true})} />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hero Main Title (Bangla)</Label>
                        <Input value={formData.heroTitle} onChange={e => setFormData({...formData, heroTitle: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Hero Subtitle</Label>
                        <Input value={formData.heroSubtitle} onChange={e => setFormData({...formData, heroSubtitle: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Support Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">URL Slug (Unique)</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Link to Product</Label>
                        <Select value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Link Stock Item" /></SelectTrigger>
                          <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: SERVICE HUB (Floating) */}
                <TabsContent value="hub" className="space-y-6 mt-0">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase">Floating Service Items</Label>
                    <Button type="button" size="sm" onClick={() => addItem('floatingServices', { name: '', image: '', link: '' })} variant="outline"><Plus size={14} /> Add Item</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.floatingServices?.map((s: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 relative">
                        <div className="flex-1 space-y-2">
                          <Input placeholder="Service Name" value={s.name} onChange={e => {
                            const list = [...formData.floatingServices];
                            list[i].name = e.target.value;
                            setFormData({...formData, floatingServices: list});
                          }} className="h-9" />
                          <Input placeholder="Link (e.g. /service-slug)" value={s.link} onChange={e => {
                            const list = [...formData.floatingServices];
                            list[i].link = e.target.value;
                            setFormData({...formData, floatingServices: list});
                          }} className="h-9" />
                        </div>
                        <ImageUploader initialUrl={s.image} onUpload={url => {
                          const list = [...formData.floatingServices];
                          list[i].image = url;
                          setFormData({...formData, floatingServices: list});
                        }} aspectRatio="aspect-square w-16" />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => removeItem('floatingServices', i)}><X size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* TAB: INCLUDING */}
                <TabsContent value="including" className="space-y-6 mt-0">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase">Grid Services (Minimum 5 for best look)</Label>
                    <Button type="button" size="sm" onClick={() => addItem('includingItems', { title: '', description: '', image: '' })} variant="outline"><Plus size={14} /> Add Service</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.includingItems?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-white border rounded-2xl space-y-3 relative">
                        <ImageUploader initialUrl={item.image} onUpload={url => {
                          const list = [...formData.includingItems];
                          list[i].image = url;
                          setFormData({...formData, includingItems: list});
                        }} label="Service Icon" />
                        <Input placeholder="Title" value={item.title} onChange={e => {
                          const list = [...formData.includingItems];
                          list[i].title = e.target.value;
                          setFormData({...formData, includingItems: list});
                        }} className="h-9 font-bold" />
                        <Input placeholder="Short Desc" value={item.description} onChange={e => {
                          const list = [...formData.includingItems];
                          list[i].description = e.target.value;
                          setFormData({...formData, includingItems: list});
                        }} className="h-9 text-[10px]" />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => removeItem('includingItems', i)}><X size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* TAB: DETAILS */}
                <TabsContent value="details" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest">General Content</Label>
                    <Textarea 
                      value={formData.detailsContent?.text} 
                      onChange={e => setFormData({...formData, detailsContent: {...formData.detailsContent, text: e.target.value}})}
                      placeholder="বিস্তারিত তথ্য লিখুন..."
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-between items-center pt-4">
                      <Label className="text-xs font-black uppercase">Feature Cards</Label>
                      <Button type="button" size="sm" onClick={() => {
                        const features = [...(formData.detailsContent?.features || []), { title: '', description: '' }];
                        setFormData({...formData, detailsContent: {...formData.detailsContent, features}});
                      }} variant="outline"><Plus size={14} /> Add Feature</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.detailsContent?.features?.map((f: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-2 relative">
                          <Input placeholder="Title" value={f.title} onChange={e => {
                            const list = [...formData.detailsContent.features];
                            list[i].title = e.target.value;
                            setFormData({...formData, detailsContent: {...formData.detailsContent, features: list}});
                          }} className="h-9 font-bold" />
                          <Input placeholder="Description" value={f.description} onChange={e => {
                            const list = [...formData.detailsContent.features];
                            list[i].description = e.target.value;
                            setFormData({...formData, detailsContent: {...formData.detailsContent, features: list}});
                          }} className="h-9" />
                          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => {
                            const list = [...formData.detailsContent.features];
                            list.splice(i, 1);
                            setFormData({...formData, detailsContent: {...formData.detailsContent, features: list}});
                          }}><X size={14} /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: PRICING */}
                <TabsContent value="pricing" className="space-y-6 mt-0">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase">Pricing Categories (e.g. Home, Office)</Label>
                    <Button type="button" size="sm" onClick={() => addItem('pricingCategories', { name: '', packages: [] })} variant="outline"><Plus size={14} /> Add Category</Button>
                  </div>
                  {formData.pricingCategories?.map((cat: any, i: number) => (
                    <Card key={i} className="border-none bg-gray-50/50 p-6 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-4">
                        <Input placeholder="Category Name (e.g. Home Cleaning)" value={cat.name} onChange={e => {
                          const list = [...formData.pricingCategories];
                          list[i].name = e.target.value;
                          setFormData({...formData, pricingCategories: list});
                        }} className="h-11 font-black uppercase text-xs" />
                        <Button type="button" size="sm" onClick={() => {
                          const list = [...formData.pricingCategories];
                          list[i].packages = [...(list[i].packages || []), { name: '', price: 0, originalPrice: 0 }];
                          setFormData({...formData, pricingCategories: list});
                        }} className="gap-2"><Plus size={14} /> Package</Button>
                        <Button variant="ghost" size="icon" onClick={() => removeItem('pricingCategories', i)} className="text-destructive"><Trash2 size={18}/></Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cat.packages?.map((pkg: any, j: number) => (
                          <div key={j} className="p-4 bg-white border rounded-2xl space-y-2 relative">
                            <Input placeholder="Pkg Name" value={pkg.name} onChange={e => {
                              const list = [...formData.pricingCategories];
                              list[i].packages[j].name = e.target.value;
                              setFormData({...formData, pricingCategories: list});
                            }} className="h-8 font-bold" />
                            <div className="flex gap-2">
                              <Input type="number" placeholder="Price" value={pkg.price} onChange={e => {
                                const list = [...formData.pricingCategories];
                                list[i].packages[j].price = parseInt(e.target.value) || 0;
                                setFormData({...formData, pricingCategories: list});
                              }} className="h-8" />
                              <Input type="number" placeholder="Old" value={pkg.originalPrice} onChange={e => {
                                const list = [...formData.pricingCategories];
                                list[i].packages[j].originalPrice = parseInt(e.target.value) || 0;
                                setFormData({...formData, pricingCategories: list});
                              }} className="h-8 text-[10px]" />
                            </div>
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-destructive" onClick={() => {
                              const list = [...formData.pricingCategories];
                              list[i].packages.splice(j, 1);
                              setFormData({...formData, pricingCategories: list});
                            }}><X size={12} /></Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </TabsContent>

              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl uppercase tracking-tighter">
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
