'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
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
  ListChecks,
  ShoppingBag,
  Package,
  X,
  Layers,
  Wrench,
  ChevronDown
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
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    slug: '',
    type: 'product',
    title: '',
    subtitle: '',
    offer: '',
    description: '',
    price: 0,
    discountPrice: 0,
    imageUrl: '',
    videoUrl: '',
    active: true,
    phone: '01919640422',
    benefits: ['', '', ''],
    whyChoose: ['', '', ''],
    stockText: 'মাত্র ১২ টি বাকি',
    offerText: 'ফ্রি ডেলিভারি!',
    ingredients: [],
    packages: [], // For Product
    serviceTypes: [], // For Complex Services
  });

  const pagesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'landing_pages'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const handleOpenDialog = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        ...formData,
        ...page,
        active: page.active ?? true,
        benefits: page.benefits || ['', '', ''],
        whyChoose: page.whyChoose || ['', '', ''],
        ingredients: page.ingredients || [],
        packages: page.packages || [],
        serviceTypes: page.serviceTypes || [],
      });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
        type: 'product',
        title: '',
        subtitle: '',
        offer: '',
        description: '',
        price: 0,
        discountPrice: 0,
        imageUrl: '',
        videoUrl: '',
        active: true,
        phone: '01919640422',
        benefits: ['', '', ''],
        whyChoose: ['', '', ''],
        stockText: 'মাত্র ১২ টি বাকি',
        offerText: 'ফ্রি ডেলিভারি!',
        ingredients: [],
        packages: [],
        serviceTypes: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const slug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = {
      ...formData,
      slug,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPage) {
        await updateDoc(doc(db, 'landing_pages', editingPage.id), data);
        toast({ title: "Landing Page Updated" });
      } else {
        await addDoc(collection(db, 'landing_pages'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Landing Page Created" });
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addServiceType = () => {
    const newType = { name: '', packages: [{ name: 'Standard', price: 0 }], addons: [] };
    setFormData({ ...formData, serviceTypes: [...formData.serviceTypes, newType] });
  };

  const addPackageToService = (typeIdx: number) => {
    const newTypes = [...formData.serviceTypes];
    newTypes[typeIdx].packages.push({ name: '', price: 0 });
    setFormData({ ...formData, serviceTypes: newTypes });
  };

  const addAddonToService = (typeIdx: number) => {
    const newTypes = [...formData.serviceTypes];
    newTypes[typeIdx].addons.push({ name: '', price: 0 });
    setFormData({ ...formData, serviceTypes: newTypes });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground text-sm font-medium">Create high-converting landing pages for products or services</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Campaign Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : pages?.map((page) => (
          <Card key={page.id} className={cn(
            "border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100",
            !page.active && "opacity-60 grayscale"
          )}>
            <div className="aspect-[21/9] relative bg-gray-50 border-b">
              {page.imageUrl ? (
                <img src={page.imageUrl} alt={page.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Zap size={40} /></div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={cn(page.type === 'product' ? "bg-red-600" : "bg-blue-600", "text-white border-none uppercase font-black text-[8px]")}>
                  {page.type?.toUpperCase() || 'PRODUCT'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm line-clamp-1">{page.title}</h3>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-[10px] font-mono text-primary font-bold">/{page.slug}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild>
                    <Link href={`/${page.slug}`} target="_blank"><ExternalLink size={14} /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDialog(page)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'landing_pages', page.id))}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className={cn("p-8 text-white shrink-0", formData.type === 'product' ? "bg-red-600" : "bg-blue-600")}>
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="text-yellow-400" /> {editingPage ? 'Update Campaign Page' : 'New Sales Engine'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-gray-100 rounded-none h-12 p-0 flex justify-start px-8 gap-8 border-b">
                <TabsTrigger value="basic" className="text-xs font-black uppercase">Identity</TabsTrigger>
                <TabsTrigger value="config" className="text-xs font-black uppercase">Selection Logic</TabsTrigger>
                <TabsTrigger value="extra" className="text-xs font-black uppercase">Benefits</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Page Type</Label>
                        <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Selling Physical Product</SelectItem>
                            <SelectItem value="service">Booking Complex Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Slug</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono" required />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ImageUploader label="Banner" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Call Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="space-y-8 mt-0">
                  {formData.type === 'product' ? (
                    /* PRODUCT PACKAGES */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-black uppercase">Product Package Sizes</Label>
                        <Button type="button" size="sm" onClick={() => setFormData({...formData, packages: [...formData.packages, {name: '', price: 0, discountPrice: 0}]})}><Plus size={14} /></Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.packages.map((pkg: any, idx: number) => (
                          <Card key={idx} className="p-4 bg-gray-50 border-none shadow-none rounded-2xl relative">
                            <button type="button" onClick={() => setFormData({...formData, packages: formData.packages.filter((_:any, i:any) => i !== idx)})} className="absolute top-2 right-2 text-red-500"><X size={14}/></button>
                            <div className="grid grid-cols-1 gap-3 pt-4">
                              <Input placeholder="Package Name (e.g. 1kg)" value={pkg.name} onChange={e => {
                                const newP = [...formData.packages]; newP[idx].name = e.target.value; setFormData({...formData, packages: newP});
                              }} className="h-9 bg-white border-none text-xs font-bold" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Old Price" value={pkg.price} onChange={e => {
                                  const newP = [...formData.packages]; newP[idx].price = Number(e.target.value); setFormData({...formData, packages: newP});
                                }} className="h-9 bg-white border-none text-xs" />
                                <Input type="number" placeholder="Offer Price" value={pkg.discountPrice} onChange={e => {
                                  const newP = [...formData.packages]; newP[idx].discountPrice = Number(e.target.value); setFormData({...formData, packages: newP});
                                }} className="h-9 bg-primary/10 border-none text-xs font-black" />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* COMPLEX SERVICE LOGIC */
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-black uppercase">Service Hierarchy (Type &gt; Packages &gt; Addons)</Label>
                        <Button type="button" size="sm" onClick={addServiceType} className="gap-2"><Wrench size={14} /> Add Service Category</Button>
                      </div>
                      
                      <div className="space-y-10">
                        {formData.serviceTypes.map((type: any, typeIdx: number) => (
                          <Card key={typeIdx} className="p-6 md:p-8 bg-blue-50/30 border-2 border-blue-100 rounded-[2.5rem] relative">
                            <button type="button" onClick={() => setFormData({...formData, serviceTypes: formData.serviceTypes.filter((_:any, i:any) => i !== typeIdx)})} className="absolute top-6 right-6 text-red-500"><X size={20}/></button>
                            
                            <div className="space-y-6">
                              <div className="space-y-2 max-w-md">
                                <Label className="text-[10px] font-black uppercase text-blue-600">Service Category Name</Label>
                                <Input value={type.name} onChange={e => {
                                  const newT = [...formData.serviceTypes]; newT[typeIdx].name = e.target.value; setFormData({...formData, serviceTypes: newT});
                                }} placeholder="e.g. AC Service" className="h-12 bg-white border-none rounded-xl font-bold" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Packages */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase">Base Packages</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addPackageToService(typeIdx)} className="h-7 text-blue-600 font-black text-[9px] uppercase"><Plus size={12} /> Add Tier</Button>
                                  </div>
                                  <div className="space-y-3">
                                    {type.packages.map((pkg: any, pkgIdx: number) => (
                                      <div key={pkgIdx} className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-blue-50">
                                        <Input placeholder="Tier" value={pkg.name} onChange={e => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].packages[pkgIdx].name = e.target.value; setFormData({...formData, serviceTypes: newT});
                                        }} className="h-8 border-none text-[10px] font-bold" />
                                        <Input type="number" placeholder="Price" value={pkg.price} onChange={e => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].packages[pkgIdx].price = Number(e.target.value); setFormData({...formData, serviceTypes: newT});
                                        }} className="h-8 border-none text-[10px] font-black w-20" />
                                        <button type="button" onClick={() => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].packages = newT[typeIdx].packages.filter((_:any, i:any) => i !== pkgIdx); setFormData({...formData, serviceTypes: newT});
                                        }} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Addons */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase">Extra Add-ons</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addAddonToService(typeIdx)} className="h-7 text-emerald-600 font-black text-[9px] uppercase"><Plus size={12} /> Add Task</Button>
                                  </div>
                                  <div className="space-y-3">
                                    {type.addons?.map((addon: any, addIdx: number) => (
                                      <div key={addIdx} className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-emerald-50">
                                        <Input placeholder="Addon" value={addon.name} onChange={e => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].addons[addIdx].name = e.target.value; setFormData({...formData, serviceTypes: newT});
                                        }} className="h-8 border-none text-[10px] font-bold" />
                                        <Input type="number" placeholder="+৳" value={addon.price} onChange={e => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].addons[addIdx].price = Number(e.target.value); setFormData({...formData, serviceTypes: newT});
                                        }} className="h-8 border-none text-[10px] font-black w-20 text-emerald-600" />
                                        <button type="button" onClick={() => {
                                          const newT = [...formData.serviceTypes]; newT[typeIdx].addons = newT[typeIdx].addons.filter((_:any, i:any) => i !== addIdx); setFormData({...formData, serviceTypes: newT});
                                        }} className="text-red-400 p-1"><X size={14}/></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="extra" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">Core Benefits (3 Items)</Label>
                      {formData.benefits.map((b: string, i: number) => (
                        <Input key={i} value={b} onChange={e => {
                          const newB = [...formData.benefits]; newB[i] = e.target.value; setFormData({...formData, benefits: newB});
                        }} className="h-11 bg-gray-50 border-none rounded-xl" />
                      ))}
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">Trust Points (3 Items)</Label>
                      {formData.whyChoose.map((w: string, i: number) => (
                        <Input key={i} value={w} onChange={e => {
                          const newW = [...formData.whyChoose]; newW[i] = e.target.value; setFormData({...formData, whyChoose: newW});
                        }} className="h-11 bg-gray-50 border-none rounded-xl" />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl uppercase tracking-tighter">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                {editingPage ? 'Sync Updates' : 'Deploy Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
