
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
  Settings2,
  Columns,
  Grid
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HeroBannersAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners'), orderBy('order', 'asc')) : null, [db]);
  const { data: banners, isLoading } = useCollection(bannersQuery);

  const handleAddBanner = async (type: 'main' | 'side') => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'hero_banners'), {
        title: type === 'main' ? 'New Dynamic Slide' : 'Side Promo Banner',
        subtitle: type === 'main' ? 'Experience the next level of cleaning' : 'Short promo text',
        imageUrl: '',
        isActive: true,
        type: type,
        order: (banners?.filter(b => b.type === type).length || 0),
        isTextEnabled: type === 'main',
        textAlignment: 'center',
        textPosition: 'center',
        titleColor: '#ffffff',
        titleSize: 'text-4xl',
        overlayColor: '#000000',
        overlayOpacity: type === 'main' ? 40 : 0,
        isButtonEnabled: type === 'main',
        buttonText: type === 'main' ? 'Book Now' : '',
        buttonLink: type === 'main' ? '/services' : '',
        buttonColor: '#22c55e',
        buttonSize: 'lg',
        buttonShape: 'rounded-xl',
        createdAt: new Date().toISOString()
      });
      toast({ title: `${type === 'main' ? 'Slide' : 'Side Banner'} Created` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to create banner" });
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
    if (!db || !confirm("Delete this banner?")) return;
    try {
      await deleteDoc(doc(db, 'hero_banners', id));
      toast({ title: "Banner Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  const mainBanners = banners?.filter(b => b.type === 'main' || !b.type);
  const sideBanners = banners?.filter(b => b.type === 'side');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Section Management</h1>
          <p className="text-muted-foreground text-sm">Design your homepage first-view (Grid Layout: 1 Main + 2 Side Banners)</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <Link href="/" target="_blank"><Eye size={16} /> View Homepage</Link>
           </Button>
        </div>
      </div>

      <Tabs defaultValue="main" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 w-full max-w-md">
          <TabsTrigger value="main" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Main Slider
          </TabsTrigger>
          <TabsTrigger value="side" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Columns size={16} /> Side Promo (2 Slots)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Main Carousel Slides ({mainBanners?.length || 0})</h2>
            <Button onClick={() => handleAddBanner('main')} className="gap-2 font-black shadow-lg uppercase text-xs">
              <Plus size={16} /> Add Slide
            </Button>
          </div>

          <div className="space-y-10">
            {mainBanners?.map((banner) => (
              <BannerEditor key={banner.id} banner={banner} onUpdate={handleUpdateBanner} onDelete={handleDeleteBanner} isSide={false} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="side" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Side Action Banners ({sideBanners?.length || 0}/2)</h2>
            <Button onClick={() => handleAddBanner('side')} disabled={sideBanners?.length >= 2} className="gap-2 font-black shadow-lg uppercase text-xs">
              <Plus size={16} /> Add Side Banner
            </Button>
          </div>

          <div className="space-y-10">
            {sideBanners?.map((banner) => (
              <BannerEditor key={banner.id} banner={banner} onUpdate={handleUpdateBanner} onDelete={handleDeleteBanner} isSide={true} />
            ))}
            {sideBanners?.length === 0 && (
              <div className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-white text-muted-foreground italic">
                No side banners active. Using site defaults.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BannerEditor({ banner, onUpdate, onDelete, isSide }: { banner: any, onUpdate: any, onDelete: any, isSide: boolean }) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group border border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 p-6 bg-gray-50/50 border-r border-gray-100 flex flex-col gap-6">
          <div className="max-w-[350px] mx-auto w-full">
            <ImageUploader 
              initialUrl={banner.imageUrl}
              label={isSide ? "Banner Image" : "Slide Background (982x500)"}
              aspectRatio={isSide ? "aspect-[1/1]" : "aspect-[982/500]"}
              onUpload={(url) => onUpdate(banner.id, { imageUrl: url })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2">
                <Switch checked={banner.isActive} onCheckedChange={(val) => onUpdate(banner.id, { isActive: val })} />
                <span className="text-[10px] font-bold">{banner.isActive ? 'LIVE' : 'HIDDEN'}</span>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground">Sort Order</Label>
              <Input type="number" defaultValue={banner.order} onBlur={(e) => onUpdate(banner.id, { order: Number(e.target.value) })} className="h-8 bg-gray-50 border-none text-xs font-bold" />
            </div>
          </div>

          {!isSide && (
            <div className="space-y-4">
              <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2"><Palette size={12} /> Overlay Opacity ({banner.overlayOpacity || 40}%)</Label>
              <Slider defaultValue={[banner.overlayOpacity || 40]} max={100} step={1} onValueCommit={(val) => onUpdate(banner.id, { overlayOpacity: val[0] })} />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-primary text-xs flex items-center gap-2"><Type size={16} /> {isSide ? 'Side Action' : 'Content Settings'}</h3>
            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={() => onDelete(banner.id)}><Trash2 size={16} /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Main Title</Label>
                <Input defaultValue={banner.title} onBlur={(e) => onUpdate(banner.id, { title: e.target.value })} className="h-11 bg-gray-50 border-none font-bold" />
              </div>
              {!isSide && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Subtitle</Label>
                  <Textarea defaultValue={banner.subtitle} onBlur={(e) => onUpdate(banner.id, { subtitle: e.target.value })} className="bg-gray-50 border-none min-h-[80px]" />
                </div>
              )}
              {!isSide && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Title Color</Label>
                    <Input type="color" defaultValue={banner.titleColor || '#ffffff'} onBlur={(e) => onUpdate(banner.id, { titleColor: e.target.value })} className="h-10 p-1 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Title Size</Label>
                    <Select defaultValue={banner.titleSize || 'text-4xl'} onValueChange={(val) => onUpdate(banner.id, { titleSize: val })}>
                      <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-2xl">Small</SelectItem>
                        <SelectItem value="text-4xl">Medium</SelectItem>
                        <SelectItem value="text-6xl">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase flex items-center gap-2"><MousePointer2 size={12}/> Redirection</Label>
                {!isSide && <Switch checked={banner.isButtonEnabled !== false} onCheckedChange={(val) => onUpdate(banner.id, { isButtonEnabled: val })} />}
              </div>
              {!isSide && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Button Label</Label>
                  <Input defaultValue={banner.buttonText} onBlur={(e) => onUpdate(banner.id, { buttonText: e.target.value })} className="h-11 bg-gray-50 border-none" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Target Link</Label>
                <Input defaultValue={banner.buttonLink} onBlur={(e) => onUpdate(banner.id, { buttonLink: e.target.value })} className="h-11 bg-gray-50 border-none" placeholder="/services" />
              </div>
              {!isSide && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Color</Label>
                    <Input type="color" defaultValue={banner.buttonColor || '#22c55e'} onBlur={(e) => onUpdate(banner.id, { buttonColor: e.target.value })} className="h-10 p-1 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Shape</Label>
                    <Select defaultValue={banner.buttonShape || 'rounded-xl'} onValueChange={(val) => onUpdate(banner.id, { buttonShape: val })}>
                      <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded-none">Square</SelectItem>
                        <SelectItem value="rounded-xl">Rounded</SelectItem>
                        <SelectItem value="rounded-full">Pill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
