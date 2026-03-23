
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
  X,
  Wrench,
  Package,
  ImageIcon
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
    subtitle: '',
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
    benefits: ['', '', ''],
    whyChoose: ['', '', ''],
    stockText: 'মাত্র ১২ টি বাকি',
    ingredients: [],
    packages: [],
    serviceTypes: [],
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
        title: '',
        subtitle: '',
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
        benefits: ['', '', ''],
        whyChoose: ['', '', ''],
        stockText: 'মাত্র ১২ টি বাকি',
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground text-sm font-medium">Create high-converting campaign pages</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Campaign Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : pages?.map((page) => (
          <Card key={page.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100", !page.active && "opacity-60 grayscale")}>
            <div className="aspect-[21/9] relative bg-gray-50 border-b">
              <img src={page.bannerImage || page.imageUrl} alt={page.title} className="w-full h-full object-cover" />
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
        <DialogContent className="max-w-5xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className={cn("p-8 text-white shrink-0", formData.type === 'product' ? "bg-red-600" : "bg-blue-600")}>
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Sparkles className="text-yellow-400" /> {editingPage ? 'Update Campaign Page' : 'New Sales Engine'}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-gray-100 rounded-none h-12 p-0 flex justify-start px-8 gap-8 border-b">
                <TabsTrigger value="basic" className="text-xs font-black uppercase">Identity & Link</TabsTrigger>
                <TabsTrigger value="media" className="text-xs font-black uppercase">Visuals</TabsTrigger>
                <TabsTrigger value="logic" className="text-xs font-black uppercase">Offers & Details</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Linked Inventory Product</Label>
                        <Select value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Product" /></SelectTrigger>
                          <SelectContent>
                            {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Page Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">URL Slug</Label>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-mono" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Page Type</Label>
                        <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="product">Product Landing</SelectItem><SelectItem value="service">Service Booking</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Support WhatsApp/Call</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <ImageUploader label="Product Image" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} />
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <Label className="text-xs font-bold">Use Custom Hero Banner</Label>
                        <Switch checked={formData.useCustomBanner} onCheckedChange={val => setFormData({...formData, useCustomBanner: val})} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ImageUploader label="Custom Hero Banner (21:9)" initialUrl={formData.bannerImage} onUpload={url => setFormData({...formData, bannerImage: url})} />
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">YouTube Video URL</Label>
                        <div className="relative"><Video size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl pl-12" /></div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logic" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">Core Benefits</Label>
                      {formData.benefits.map((b: string, i: number) => (
                        <Input key={i} value={b} onChange={e => { const nb = [...formData.benefits]; nb[i] = e.target.value; setFormData({...formData, benefits: nb}); }} className="h-11 bg-gray-50 border-none rounded-xl" />
                      ))}
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase">Trust Factors</Label>
                      {formData.whyChoose.map((w: string, i: number) => (
                        <Input key={i} value={w} onChange={e => { const nw = [...formData.whyChoose]; nw[i] = e.target.value; setFormData({...formData, whyChoose: nw}); }} className="h-11 bg-gray-50 border-none rounded-xl" />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl uppercase tracking-tighter">{isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}{editingPage ? 'Sync Updates' : 'Deploy Page'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
