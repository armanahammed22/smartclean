
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout, 
  Save, 
  Eye, 
  Loader2,
  Plus,
  Megaphone,
  BellRing,
  Trash2,
  Zap,
  ArrowRight,
  Type,
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Move
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
  const [isSaving, setIsSubmitting] = useState(false);

  // Queries
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners'), orderBy('order', 'asc')) : null, [db]);
  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  
  const { data: banners, isLoading: bannersLoading } = useCollection(bannersQuery);
  const { data: marqueeSettings, isLoading: marqueeLoading } = useCollection(marqueeRef as any);
  const { data: customization, isLoading: customLoading } = useCollection(customizationRef as any);

  const handleAddBanner = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'hero_banners'), {
        title: 'New Dynamic Slide',
        subtitle: 'Experience the next level of cleaning',
        imageUrl: '',
        isActive: false,
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

  if (bannersLoading || marqueeLoading || customLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Customize</h1>
          <p className="text-muted-foreground text-sm">Control your homepage dynamic layout and messaging</p>
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
            <h2 className="text-lg font-bold">Manage Slides ({banners?.length || 0})</h2>
            <Button onClick={handleAddBanner} className="gap-2 font-black shadow-lg uppercase text-xs">
              <Plus size={16} /> New Dynamic Slide
            </Button>
          </div>

          <div className="space-y-10">
            {banners?.map((banner) => (
              <Card key={banner.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Visual Preview & Status */}
                  <div className="lg:col-span-4 p-8 bg-gray-50/50 border-r border-gray-100 flex flex-col gap-6">
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
                          <Switch 
                            checked={banner.isActive} 
                            onCheckedChange={(val) => handleUpdateBanner(banner.id, { isActive: val })} 
                          />
                          <span className="text-[10px] font-bold">{banner.isActive ? 'LIVE' : 'HIDDEN'}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Order</Label>
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
                  </div>

                  {/* Settings Pane */}
                  <div className="lg:col-span-8 p-10 space-y-10">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black uppercase tracking-widest text-primary text-xs flex items-center gap-2">
                        <Type size={16} /> Content & Typography
                      </h3>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={() => handleDeleteBanner(banner.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Text Controls */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Title Text</Label>
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
                            <Label className="text-[10px] font-black uppercase">Alignment</Label>
                            <Select defaultValue={banner.textAlignment || 'center'} onValueChange={(val) => handleUpdateBanner(banner.id, { textAlignment: val })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Button & Layout Controls */}
                      <div className="space-y-6">
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
                            placeholder="/products"
                            className="h-11 bg-gray-50 border-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Text Position</Label>
                            <Select defaultValue={banner.textPosition || 'center'} onValueChange={(val) => handleUpdateBanner(banner.id, { textPosition: val })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Button Style</Label>
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

            {banners?.length === 0 && (
              <div className="p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic">
                No dynamic slides found. Click "New Dynamic Slide" to start building your carousel.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marquee">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-lg font-bold">Top Announcement Bar</CardTitle>
              <CardDescription>A scrolling notification bar at the very top of the site.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="p-20 text-center border-2 border-dashed rounded-[2rem] text-muted-foreground italic">
                Marquee management module coming in next update.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
