'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout, 
  Eye, 
  Loader2,
  Plus,
  BellRing,
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

export default function SiteCustomizePage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Queries
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners'), orderBy('order', 'asc')) : null, [db]);
  const { data: banners, isLoading: bannersLoading } = useCollection(bannersQuery);

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

  if (bannersLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Customize</h1>
          <p className="text-muted-foreground text-sm">Control your dynamic hero slider and global layout</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <Link href="/" target="_blank"><Eye size={16} /> Preview Site</Link>
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Dynamic Hero Slider
          </TabsTrigger>
          <TabsTrigger value="marquee" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BellRing size={16} /> Announcement Bar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold uppercase tracking-tight">Manage Slides ({banners?.length || 0})</h2>
            <Button onClick={handleAddBanner} className="gap-2 font-black shadow-lg uppercase text-xs">
              <Plus size={16} /> New Dynamic Slide
            </Button>
          </div>

          <div className="space-y-10">
            {banners?.map((banner) => (
              <Card key={banner.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left: Media & Basic Control - Increased span to lg:col-span-5 and reduced padding */}
                  <div className="lg:col-span-5 p-6 bg-gray-50/50 border-r border-gray-100 flex flex-col gap-6">
                    <ImageUploader 
                      initialUrl={banner.imageUrl}
                      label="Slide Background Image"
                      aspectRatio="aspect-[21/9]"
                      onUpload={(url) => handleUpdateBanner(banner.id, { imageUrl: url })}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Status</Label>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={banner.isActive} 
                            onCheckedChange={(val) => handleUpdateBanner(banner.id, { isActive: val })} 
                          />
                          <span className="text-[10px] font-bold">{banner.isActive ? 'LIVE' : 'HIDDEN'}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Sort Order</Label>
                        <Input 
                          type="number" 
                          defaultValue={banner.order} 
                          onBlur={(e) => handleUpdateBanner(banner.id, { order: Number(e.target.value) })}
                          className="h-8 bg-gray-50 border-none text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2">
                        <Palette size={12} /> Overlay Opacity ({banner.overlayOpacity || 40}%)
                      </Label>
                      <Slider 
                        defaultValue={[banner.overlayOpacity || 40]} 
                        max={100} 
                        step={1} 
                        onValueCommit={(val) => handleUpdateBanner(banner.id, { overlayOpacity: val[0] })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Overlay Color</Label>
                      <Input 
                        type="color"
                        defaultValue={banner.overlayColor || '#000000'}
                        onBlur={(e) => handleUpdateBanner(banner.id, { overlayColor: e.target.value })}
                        className="h-10 w-full p-1 bg-white border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Right: Rich Configuration - Reduced span to lg:col-span-7 */}
                  <div className="lg:col-span-7 p-8 space-y-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <h3 className="font-black uppercase tracking-widest text-primary text-xs flex items-center gap-2">
                          <Type size={16} /> Content & Layout
                        </h3>
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <Switch 
                            checked={banner.isTextEnabled !== false} 
                            onCheckedChange={(val) => handleUpdateBanner(banner.id, { isTextEnabled: val })} 
                          />
                          <span className="text-[10px] font-bold uppercase">Show Text</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={() => handleDeleteBanner(banner.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Typography Settings */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Main Title</Label>
                          <Input 
                            defaultValue={banner.title} 
                            onBlur={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                            className="h-11 bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Subtitle Text</Label>
                          <Textarea 
                            defaultValue={banner.subtitle} 
                            onBlur={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                            className="bg-gray-50 border-none min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Title Color</Label>
                            <Input 
                              type="color"
                              defaultValue={banner.titleColor || '#ffffff'}
                              onBlur={(e) => handleUpdateBanner(banner.id, { titleColor: e.target.value })}
                              className="h-10 w-full p-1 bg-gray-50 border-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Title Size</Label>
                            <Select defaultValue={banner.titleSize || 'text-4xl'} onValueChange={(val) => handleUpdateBanner(banner.id, { titleSize: val })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text-2xl">Small</SelectItem>
                                <SelectItem value="text-4xl">Medium</SelectItem>
                                <SelectItem value="text-6xl">Large</SelectItem>
                                <SelectItem value="text-8xl">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Text Alignment</Label>
                            <Select defaultValue={banner.textAlignment || 'center'} onValueChange={(val) => handleUpdateBanner(banner.id, { textAlignment: val })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Content Position</Label>
                            <Select defaultValue={banner.textPosition || 'center'} onValueChange={(val) => handleUpdateBanner(banner.id, { textPosition: val })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="center">Middle</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* CTA Action Settings */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase flex items-center gap-2"><MousePointer2 size={12}/> Button Action</Label>
                          <Switch 
                            checked={banner.isButtonEnabled !== false} 
                            onCheckedChange={(val) => handleUpdateBanner(banner.id, { isButtonEnabled: val })} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Button Label</Label>
                          <Input 
                            defaultValue={banner.buttonText} 
                            onBlur={(e) => handleUpdateBanner(banner.id, { buttonText: e.target.value })}
                            className="h-11 bg-gray-50 border-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Redirect Link</Label>
                          <Input 
                            defaultValue={banner.buttonLink} 
                            onBlur={(e) => handleUpdateBanner(banner.id, { buttonLink: e.target.value })}
                            placeholder="/services"
                            className="h-11 bg-gray-50 border-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Button Color</Label>
                            <Input 
                              type="color"
                              defaultValue={banner.buttonColor || '#22c55e'}
                              onBlur={(e) => handleUpdateBanner(banner.id, { buttonColor: e.target.value })}
                              className="h-10 w-full p-1 bg-gray-50 border-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Button Shape</Label>
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
                        
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary flex items-center gap-2">
                            <Settings2 size={12}/> Design Hint: Use high contrast colors for the button to increase conversion rates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {banners?.length === 0 && (
              <div className="p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic">
                No dynamic slides found. Click "New Dynamic Slide" to start building your professional hero slider.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marquee">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-lg font-bold">Top Announcement Bar</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="p-20 text-center border-2 border-dashed rounded-[2rem] text-muted-foreground italic">
                Global announcement management module is scheduled for the next system update.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
