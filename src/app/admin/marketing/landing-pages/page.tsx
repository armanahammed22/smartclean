
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
  X
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

export default function LandingPagesAdminPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const [formData, setFormData] = useState({
    slug: '',
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
    ingredients: [] as { name: string; imageUrl: string }[],
    packages: [] as { name: string; price: number; discountPrice: number }[],
  });

  const pagesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'landing_pages'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const handleOpenDialog = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        slug: page.slug || '',
        title: page.title || '',
        subtitle: page.subtitle || '',
        offer: page.offer || '',
        description: page.description || '',
        price: page.price || 0,
        discountPrice: page.discountPrice || 0,
        imageUrl: page.imageUrl || '',
        videoUrl: page.videoUrl || '',
        active: page.active ?? true,
        phone: page.phone || '01919640422',
        benefits: page.benefits || ['', '', ''],
        whyChoose: page.whyChoose || ['', '', ''],
        stockText: page.stockText || 'মাত্র ১২ টি বাকি',
        offerText: page.offerText || 'ফ্রি ডেলিভারি!',
        ingredients: page.ingredients || [],
        packages: page.packages || [],
      });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
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
      price: Number(formData.price),
      discountPrice: Number(formData.discountPrice),
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

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently delete this landing page?")) return;
    try {
      await deleteDoc(doc(db, 'landing_pages', id));
      toast({ title: "Page Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Product Landing Pages</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage high-converting product pages with order forms</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Landing Page
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
                <Badge className={cn(page.active ? "bg-green-500" : "bg-gray-400", "text-white border-none uppercase font-black text-[8px]")}>
                  {page.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm line-clamp-1">{page.title}</h3>
                <p className="text-[10px] font-mono text-primary font-bold">/{page.slug}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Promo Price</span>
                  <span className="text-lg font-black text-red-600">৳{page.discountPrice?.toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" asChild>
                    <Link href={`/${page.slug}`} target="_blank"><ExternalLink size={16} /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleOpenDialog(page)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(page.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 bg-red-600 text-white shrink-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="text-yellow-400" /> {editingPage ? 'Update High-Converting Page' : 'Create Sales Asset'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-gray-100 rounded-none h-12 p-0 flex justify-start px-8 gap-8 border-b">
                <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent text-xs font-black uppercase">Basic Info</TabsTrigger>
                <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent text-xs font-black uppercase">Benefits & Why</TabsTrigger>
                <TabsTrigger value="ingredients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent text-xs font-black uppercase">Ingredients</TabsTrigger>
                <TabsTrigger value="pricing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent text-xs font-black uppercase">Packages</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Page Title (Bangla Recommended)</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="যেমন: প্রিমিয়াম কালোজিরা মধু" className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Subtitle</Label>
                        <Input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="যেমন: সুস্থ থাকুন প্রাকৃতিক মধু দিয়ে" className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Slug (URL)</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="kalo-jira-modhu" className="h-12 bg-gray-50 border-none rounded-xl font-mono" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Original Price (৳)</Label>
                          <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Discount Price (৳)</Label>
                          <Input type="number" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: Number(e.target.value)})} className="h-12 bg-red-50 text-red-600 border-none rounded-xl font-black text-lg" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Support Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <ImageUploader label="Main Product Image" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} aspectRatio="aspect-square" />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2"><Video size={14} /> YouTube Video URL (Optional)</Label>
                        <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Offer Text</Label>
                          <Input value={formData.offerText} onChange={e => setFormData({...formData, offerText: e.target.value})} className="h-10 bg-gray-50 border-none" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Stock Text</Label>
                          <Input value={formData.stockText} onChange={e => setFormData({...formData, stockText: e.target.value})} className="h-10 bg-gray-50 border-none" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <Label className="text-xs font-black uppercase">Live Status</Label>
                        <Switch checked={formData.active} onCheckedChange={val => setFormData({...formData, active: val})} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase flex items-center gap-2"><ListChecks size={16} className="text-red-600" /> Benefits List</Label>
                      {formData.benefits?.map((benefit, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={benefit} onChange={e => {
                            const newB = [...formData.benefits!];
                            newB[idx] = e.target.value;
                            setFormData({...formData, benefits: newB});
                          }} placeholder={`উপকারিতা ${idx+1}`} className="h-10 bg-gray-50 border-none rounded-lg" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase flex items-center gap-2"><Zap size={16} className="text-red-600" /> Why Choose Us</Label>
                      {formData.whyChoose?.map((point, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={point} onChange={e => {
                            const newW = [...formData.whyChoose!];
                            newW[idx] = e.target.value;
                            setFormData({...formData, whyChoose: newW});
                          }} placeholder={`কেন আমাদের থেকে নিবেন ${idx+1}`} className="h-10 bg-gray-50 border-none rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Detailed Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[150px] bg-gray-50 border-none rounded-2xl" />
                  </div>
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-6 mt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-widest">Product Ingredients / Components</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, ingredients: [...formData.ingredients, { name: '', imageUrl: '' }]})} className="rounded-lg">
                      <Plus size={14} className="mr-1" /> Add Item
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.ingredients.map((ing, idx) => (
                      <Card key={idx} className="p-4 bg-gray-50 border-none shadow-none rounded-2xl relative group">
                        <button type="button" onClick={() => setFormData({...formData, ingredients: formData.ingredients.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                        <ImageUploader initialUrl={ing.imageUrl} aspectRatio="aspect-square" onUpload={url => {
                          const newIng = [...formData.ingredients];
                          newIng[idx].imageUrl = url;
                          setFormData({...formData, ingredients: newIng});
                        }} label="" />
                        <Input value={ing.name} onChange={e => {
                          const newIng = [...formData.ingredients];
                          newIng[idx].name = e.target.value;
                          setFormData({...formData, ingredients: newIng});
                        }} placeholder="Ingredient Name" className="h-9 mt-2 bg-white border-none rounded-lg text-xs font-bold" />
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-6 mt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-widest">Pricing Packages</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, packages: [...formData.packages, { name: '', price: 0, discountPrice: 0 }]})} className="rounded-lg">
                      <Plus size={14} className="mr-1" /> Add Package
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.packages.map((pkg, idx) => (
                      <Card key={idx} className="p-6 bg-red-50 border border-red-100 rounded-[2rem] relative group">
                        <button type="button" onClick={() => setFormData({...formData, packages: formData.packages.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                        <div className="space-y-4">
                          <Input value={pkg.name} onChange={e => {
                            const newP = [...formData.packages];
                            newP[idx].name = e.target.value;
                            setFormData({...formData, packages: newP});
                          }} placeholder="Package Size (e.g. 500g)" className="h-10 bg-white border-none rounded-xl font-bold" />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-black opacity-40">Regular</Label>
                              <Input type="number" value={pkg.price} onChange={e => {
                                const newP = [...formData.packages];
                                newP[idx].price = Number(e.target.value);
                                setFormData({...formData, packages: newP});
                              }} className="h-9 bg-white border-none rounded-lg" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-black text-red-600">Sale</Label>
                              <Input type="number" value={pkg.discountPrice} onChange={e => {
                                const newP = [...formData.packages];
                                newP[idx].discountPrice = Number(e.target.value);
                                setFormData({...formData, packages: newP});
                              }} className="h-9 bg-white border-none rounded-lg font-black" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 bg-red-600 hover:bg-red-700 text-white shadow-xl uppercase tracking-tighter">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                {editingPage ? 'Sync Changes' : 'Publish Landing Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
