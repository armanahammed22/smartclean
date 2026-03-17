
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
  Image as ImageIcon
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

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
        title: 'New Promo Banner',
        subtitle: 'Add a compelling description here',
        imageUrl: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        isActive: false,
        order: banners?.length || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Banner Placeholder Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to create banner" });
    }
  };

  const handleUpdateBanner = async (id: string, data: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'hero_banners', id), data);
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `hero_banners/${id}`,
        operation: 'update',
        requestResourceData: data
      }));
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!db || !confirm("Delete this banner slide?")) return;
    try {
      await deleteDoc(doc(db, 'hero_banners', id));
      toast({ title: "Banner Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  const handleSaveGlobal = async (col: string, id: string, data: any) => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, col, id), data, { merge: true });
      toast({ title: "Settings Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bannersLoading || marqueeLoading || customLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Customize</h1>
          <p className="text-muted-foreground text-sm">Control your homepage visual identity and messaging</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <Link href="/" target="_blank"><Eye size={16} /> View Live Site</Link>
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero Layout (Slides)
          </TabsTrigger>
          <TabsTrigger value="marquee" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BellRing size={16} /> Marquee
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Megaphone size={16} /> Marketing Blocks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Hero Banners ({banners?.length || 0})</h2>
            <Button onClick={handleAddBanner} className="gap-2 font-bold shadow-lg">
              <Plus size={16} /> Add New Slide
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {banners?.map((banner) => (
              <Card key={banner.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Image Column */}
                  <div className="lg:col-span-4 p-6 bg-gray-50/50 border-r border-gray-100">
                    <ImageUploader 
                      initialUrl={banner.imageUrl}
                      label="Banner Image (982x500)"
                      aspectRatio="aspect-[982/500]"
                      onUpload={(url) => handleUpdateBanner(banner.id, { imageUrl: url })}
                    />
                    <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Active Status</Label>
                      <Switch 
                        checked={banner.isActive} 
                        onCheckedChange={(val) => handleUpdateBanner(banner.id, { isActive: val })} 
                      />
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="lg:col-span-8 p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-primary">
                        <Type size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Banner Content</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteBanner(banner.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Title Text</Label>
                        <Input 
                          defaultValue={banner.title} 
                          onBlur={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                          className="h-12 bg-gray-50 border-none font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Subtitle Description</Label>
                        <Textarea 
                          defaultValue={banner.subtitle} 
                          onBlur={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                          className="bg-gray-50 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Button Label</Label>
                        <Input 
                          defaultValue={banner.buttonText} 
                          onBlur={(e) => handleUpdateBanner(banner.id, { buttonText: e.target.value })}
                          className="h-11 bg-gray-50 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Redirect URL</Label>
                        <Input 
                          defaultValue={banner.buttonLink} 
                          onBlur={(e) => handleUpdateBanner(banner.id, { buttonLink: e.target.value })}
                          placeholder="e.g. /products"
                          className="h-11 bg-gray-50 border-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {banners?.length === 0 && (
              <div className="p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic">
                No active hero slides. Click "Add New Slide" to start.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marquee">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Announcement Marquee</CardTitle>
                <CardDescription>Scrolling text notification bar</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-sm text-muted-foreground">Modify scrolling announcements globally from here.</p>
              {/* Marquee form simplified for this module */}
              <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic">
                Marquee Settings integrated with Global Settings.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Custom Marketing Blocks</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic">
                Custom marketing content editor coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
