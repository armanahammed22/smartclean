
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
  Image as ImageIcon, 
  Save, 
  Eye, 
  Loader2,
  Plus,
  Megaphone,
  BellRing,
  Trash2,
  Zap,
  Info,
  AlertCircle,
  Megaphone as MegaphoneIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SiteCustomizePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  
  const { data: customization, isLoading: customLoading } = useDoc(customizationRef);
  const { data: marqueeSettings, isLoading: marqueeLoading } = useDoc(marqueeRef);

  const [formData, setFormData] = useState<any>({
    hero: { title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '', enabled: true },
    sections: { 
      campaigns: true,
      offerBanners: true,
      customContent: true
    },
    offerBanners: [],
    campaigns: [],
    marketingContent: ''
  });

  const [marqueeData, setMarqueeData] = useState<any>({
    text: '',
    label: 'INFO',
    iconName: 'BellRing',
    bgColor: 'bg-white',
    textColor: 'text-gray-600',
    fontSize: 'text-sm',
    radius: 'rounded-full',
    enabled: true,
    ctaText: '',
    ctaLink: ''
  });

  useEffect(() => {
    if (customization) {
      setFormData({
        ...formData,
        ...customization,
        hero: { ...formData.hero, ...(customization.hero || {}) },
        sections: { ...formData.sections, ...(customization.sections || {}) }
      });
    }
  }, [customization]);

  useEffect(() => {
    if (marqueeSettings) {
      setMarqueeData({ ...marqueeData, ...marqueeSettings });
    }
  }, [marqueeSettings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'homepage'), formData, { merge: true });
      await setDoc(doc(db, 'site_settings', 'marquee'), marqueeData, { merge: true });
      toast({ title: "Customization Saved", description: "Your changes have been updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not update customization." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOfferBanner = () => {
    setFormData({
      ...formData,
      offerBanners: [...(formData.offerBanners || []), { imageUrl: '', link: '', enabled: true }]
    });
  };

  const removeOfferBanner = (index: number) => {
    const updated = [...formData.offerBanners];
    updated.splice(index, 1);
    setFormData({ ...formData, offerBanners: updated });
  };

  if (customLoading || marqueeLoading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={40} /><span className="text-muted-foreground font-bold">Syncing Site Data...</span></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Customize</h1>
          <p className="text-muted-foreground text-sm">Control your homepage layout and visual identity</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <a href="/" target="_blank"><Eye size={16} /> View Live Site</a>
           </Button>
           <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save All Changes
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero
          </TabsTrigger>
          <TabsTrigger value="marquee" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BellRing size={16} /> Marquee
          </TabsTrigger>
          <TabsTrigger value="banners" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ImageIcon size={16} /> Banners
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Megaphone size={16} /> Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Primary Hero Banner</CardTitle>
                <CardDescription>Main optimized image for your website landing section (Recommended: 982x500)</CardDescription>
              </div>
              <Switch 
                checked={formData.hero.enabled} 
                onCheckedChange={(val) => setFormData({...formData, hero: {...formData.hero, enabled: val}})} 
              />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Hero Image URL</Label>
                  <Input 
                    value={formData.hero.imageUrl} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, imageUrl: e.target.value}})}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-blue-700">
                    <Info size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Optimized Size: 982 x 500 pixels</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CTA Link URL (Optional)</Label>
                  <Input 
                    value={formData.hero.ctaLink} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, ctaLink: e.target.value}})}
                    placeholder="/services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input 
                    value={formData.hero.ctaText} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, ctaText: e.target.value}})}
                    placeholder="Book Now"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marquee">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Announcement Marquee</CardTitle>
                <CardDescription>Customize the scrolling notification bar</CardDescription>
              </div>
              <Switch 
                checked={marqueeData.enabled} 
                onCheckedChange={(val) => setMarqueeData({...marqueeData, enabled: val})} 
              />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Marquee Text</Label>
                  <Input 
                    value={marqueeData.text} 
                    onChange={(e) => setMarqueeData({...marqueeData, text: e.target.value})}
                    placeholder="Leave empty to show current date automatically"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label Text</Label>
                  <Input 
                    value={marqueeData.label} 
                    onChange={(e) => setMarqueeData({...marqueeData, label: e.target.value})}
                    placeholder="e.g. INFO, UPDATE, HOT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={marqueeData.iconName} onValueChange={(val) => setMarqueeData({...marqueeData, iconName: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BellRing">Bell (Alert)</SelectItem>
                      <SelectItem value="Info">Info Circle</SelectItem>
                      <SelectItem value="Zap">Zap (Flash)</SelectItem>
                      <SelectItem value="Megaphone">Megaphone</SelectItem>
                      <SelectItem value="AlertCircle">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bar Background Color</Label>
                  <Select value={marqueeData.bgColor} onValueChange={(val) => setMarqueeData({...marqueeData, bgColor: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-white">Clean White</SelectItem>
                      <SelectItem value="bg-primary">Brand Green</SelectItem>
                      <SelectItem value="bg-blue-600">Blue</SelectItem>
                      <SelectItem value="bg-red-600">Red</SelectItem>
                      <SelectItem value="bg-amber-500">Amber</SelectItem>
                      <SelectItem value="bg-slate-800">Dark Slate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scrolling Text Color</Label>
                  <Select value={marqueeData.textColor} onValueChange={(val) => setMarqueeData({...marqueeData, textColor: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-gray-600">Standard Gray</SelectItem>
                      <SelectItem value="text-white">Pure White</SelectItem>
                      <SelectItem value="text-gray-900">Deep Black</SelectItem>
                      <SelectItem value="text-primary">Brand Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select value={marqueeData.fontSize} onValueChange={(val) => setMarqueeData({...marqueeData, fontSize: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-[10px]">Extra Small</SelectItem>
                      <SelectItem value="text-xs">Small</SelectItem>
                      <SelectItem value="text-sm">Medium</SelectItem>
                      <SelectItem value="text-base">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Box Shape</Label>
                  <Select value={marqueeData.radius} onValueChange={(val) => setMarqueeData({...marqueeData, radius: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded-full">Capsule (Full)</SelectItem>
                      <SelectItem value="rounded-2xl">Rounded (Large)</SelectItem>
                      <SelectItem value="rounded-xl">Rounded (Medium)</SelectItem>
                      <SelectItem value="rounded-none">Sharp (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CTA Link Text (Optional)</Label>
                  <Input 
                    value={marqueeData.ctaText} 
                    onChange={(e) => setMarqueeData({...marqueeData, ctaText: e.target.value})}
                    placeholder="e.g. SHOP NOW"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Link URL (Optional)</Label>
                  <Input 
                    value={marqueeData.ctaLink} 
                    onChange={(e) => setMarqueeData({...marqueeData, ctaLink: e.target.value})}
                    placeholder="e.g. /products"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Offer Banners</CardTitle>
                <CardDescription>Promotional images displayed across the site</CardDescription>
              </div>
              <Button onClick={addOfferBanner} variant="outline" className="gap-2 font-bold">
                <Plus size={16} /> Add Banner
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {formData.offerBanners?.map((banner: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-xl space-y-4 relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => removeOfferBanner(idx)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Image URL</Label>
                      <Input 
                        value={banner.imageUrl} 
                        onChange={(e) => {
                          const updated = [...formData.offerBanners];
                          updated[idx].imageUrl = e.target.value;
                          setFormData({...formData, offerBanners: updated});
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link</Label>
                      <Input 
                        value={banner.link} 
                        onChange={(e) => {
                          const updated = [...formData.offerBanners];
                          updated[idx].link = e.target.value;
                          setFormData({...formData, offerBanners: updated});
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Custom Marketing Content</CardTitle>
              <CardDescription>Add custom text blocks or promotional content sections</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <Label>Enable Custom Content Section</Label>
                <Switch 
                  checked={formData.sections?.customContent} 
                  onCheckedChange={(val) => setFormData({...formData, sections: {...formData.sections, customContent: val}})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Section Content (Markdown or Text)</Label>
                <Textarea 
                  className="min-h-[200px]"
                  value={formData.marketingContent}
                  onChange={(e) => setFormData({...formData, marketingContent: e.target.value})}
                  placeholder="Introduce your special offers or unique value propositions here..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
