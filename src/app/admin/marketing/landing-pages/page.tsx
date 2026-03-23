
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
  ChevronRight,
  Sparkles,
  Zap,
  MousePointer2,
  Package
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
    offer: '',
    description: '',
    price: 0,
    imageUrl: '',
    active: true,
    benefits: ['', '', ''],
  });

  const pagesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'landing_pages'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const handleOpenDialog = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        slug: page.slug,
        title: page.title,
        offer: page.offer,
        description: page.description,
        price: page.price,
        imageUrl: page.imageUrl,
        active: page.active,
        benefits: page.benefits || ['', '', ''],
      });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
        title: '',
        offer: '',
        description: '',
        price: 0,
        imageUrl: '',
        active: true,
        benefits: ['', '', ''],
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground text-sm font-medium">Create high-converting dynamic landing pages for marketing</p>
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
                  <span className="text-lg font-black text-primary">৳{page.price?.toLocaleString()}</span>
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
        {!pages?.length && !isLoading && (
          <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Sparkles size={48} className="opacity-20" />
            <p className="font-medium">No landing pages found. Start by creating your first marketing asset.</p>
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Zap className="text-primary" /> {editingPage ? 'Update Landing Page' : 'Create High-Conversion Page'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Page Title</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Eid Home Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Dynamic Slug (URL)</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="eid-offer" className="h-12 pl-12 bg-gray-50 border-none rounded-xl font-mono text-sm" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Flash Offer Text</Label>
                      <Input value={formData.offer} onChange={e => setFormData({...formData, offer: e.target.value})} placeholder="20% OFF TODAY" className="h-12 bg-primary/5 text-primary border-none rounded-xl font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Promo Price (৳)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Main Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-6">
                  <ImageUploader label="Page Hero Image" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} aspectRatio="aspect-video" />
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Core Benefits (Checklist)</Label>
                    {formData.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={benefit} onChange={e => {
                          const newB = [...formData.benefits!];
                          newB[idx] = e.target.value;
                          setFormData({...formData, benefits: newB});
                        }} placeholder={`Benefit ${idx+1}`} className="h-10 bg-gray-50 border-none rounded-lg text-xs" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">Live Status</Label>
                      <p className="text-[9px] text-muted-foreground font-bold">VISIBLE AT /{formData.slug || 'slug'}</p>
                    </div>
                    <Switch checked={formData.active} onCheckedChange={val => setFormData({...formData, active: val})} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl uppercase tracking-tighter">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                {editingPage ? 'Sync Changes' : 'Launch Landing Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
