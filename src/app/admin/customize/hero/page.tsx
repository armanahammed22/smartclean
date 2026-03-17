
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout, 
  Eye, 
  Loader2,
  Plus,
  Trash2,
  Type,
  Palette,
  MousePointer2,
  Settings2
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function HeroBannersAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners'), orderBy('order', 'asc')) : null, [db]);
  const { data: banners, isLoading } = useCollection(bannersQuery);

  const handleAddBanner = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'hero_banners'), {
        title: 'New Dynamic Slide',
        subtitle: 'Experience the next level of cleaning',
        imageUrl: '',
        isActive: true,
        order: banners?.length || 0,
        isTextEnabled: true,
        textAlignment: 'center',
        textPosition: 'center',
        titleColor: '#ffffff',
        titleSize: 'text-4xl',
        overlayColor: '#000000',
        overlayOpacity: 40,
        isButtonEnabled: true,
        buttonText: 'Book Now',
        buttonLink: '/services',
        buttonColor: '#22c55e',
        buttonSize: 'lg',
        buttonShape: 'rounded-xl',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Slide Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to create slide" });
    }
  };

  const handleUpdateBanner = async (id: string, data: any) => {
    if (!db) return;
    const docRef = doc(db, 'hero_banners', id);
    updateDoc(docRef, data).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data
      }));
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (!db || !confirm("Delete this dynamic slide?")) return;
    try {
      await deleteDoc(doc(db, 'hero_banners', id));
      toast({ title: "Slide Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slider Management</h1>
          <p className="text-muted-foreground text-sm">Create and style high-conversion promotional slides</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <Link href="/" target="_blank"><Eye size={16} /> Preview Site</Link>
           </Button>
           <Button onClick={handleAddBanner} className="gap-2 font-black shadow-lg uppercase text-xs">
              <Plus size={16} /> New Slide
            </Button>
        </div>
      </div>

      <div className="space-y-10">
        {banners?.map((banner) => (
          <Card key={banner.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 p-6 bg-gray-50/50 border-r border-gray-100 flex flex-col gap-6">
                <ImageUploader 
                  initialUrl={banner.imageUrl}
                  label="Slide Background"
                  aspectRatio="aspect-[21/9]"
                  onUpload={(url) => handleUpdateBanner(banner.id, { imageUrl: url })}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={banner.isActive} onCheckedChange={(val) => handleUpdateBanner(banner.id, { isActive: val })} />
                      <span className="text-[10px] font-bold">{banner.isActive ? 'LIVE' : 'HIDDEN'}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Order</Label>
                    <Input type="number" defaultValue={banner.order} onBlur={(e) => handleUpdateBanner(banner.id, { order: Number(e.target.value) })} className="h-8 bg-gray-50 border-none text-xs font-bold" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2"><Palette size={12} /> Overlay Opacity ({banner.overlayOpacity || 40}%)</Label>
                  <Slider defaultValue={[banner.overlayOpacity || 40]} max={100} step={1} onValueCommit={(val) => handleUpdateBanner(banner.id, { overlayOpacity: val[0] })} />
                </div>
              </div>

              <div className="lg:col-span-7 p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase tracking-widest text-primary text-xs flex items-center gap-2"><Type size={16} /> Content Settings</h3>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={() => handleDeleteBanner(banner.id)}><Trash2 size={16} /></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Main Title</Label>
                      <Input defaultValue={banner.title} onBlur={(e) => handleUpdateBanner(banner.id, { title: e.target.value })} className="h-11 bg-gray-50 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Subtitle</Label>
                      <Textarea defaultValue={banner.subtitle} onBlur={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })} className="bg-gray-50 border-none min-h-[80px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Title Color</Label>
                        <Input type="color" defaultValue={banner.titleColor || '#ffffff'} onBlur={(e) => handleUpdateBanner(banner.id, { titleColor: e.target.value })} className="h-10 p-1 bg-gray-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Title Size</Label>
                        <Select defaultValue={banner.titleSize || 'text-4xl'} onValueChange={(val) => handleUpdateBanner(banner.id, { titleSize: val })}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-2xl">Small</SelectItem>
                            <SelectItem value="text-4xl">Medium</SelectItem>
                            <SelectItem value="text-6xl">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase flex items-center gap-2"><MousePointer2 size={12}/> Button Action</Label>
                      <Switch checked={banner.isButtonEnabled !== false} onCheckedChange={(val) => handleUpdateBanner(banner.id, { isButtonEnabled: val })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Label</Label>
                      <Input defaultValue={banner.buttonText} onBlur={(e) => handleUpdateBanner(banner.id, { buttonText: e.target.value })} className="h-11 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Link</Label>
                      <Input defaultValue={banner.buttonLink} onBlur={(e) => handleUpdateBanner(banner.id, { buttonLink: e.target.value })} className="h-11 bg-gray-50 border-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Color</Label>
                        <Input type="color" defaultValue={banner.buttonColor || '#22c55e'} onBlur={(e) => handleUpdateBanner(banner.id, { buttonColor: e.target.value })} className="h-10 p-1 bg-gray-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Shape</Label>
                        <Select defaultValue={banner.buttonShape || 'rounded-xl'} onValueChange={(val) => handleUpdateBanner(banner.id, { buttonShape: val })}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rounded-none">Square</SelectItem>
                            <SelectItem value="rounded-xl">Rounded</SelectItem>
                            <SelectItem value="rounded-full">Pill</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
