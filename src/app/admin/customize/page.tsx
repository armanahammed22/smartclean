
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
  Save, 
  Eye, 
  Loader2,
  Plus,
  Megaphone,
  BellRing,
  Trash2,
  Info,
  Zap,
  Calendar,
  ArrowRight,
  ShoppingCart,
  Wrench,
  CheckCircle2,
  Play,
  Briefcase,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Palette,
  Type
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const BUTTON_ICONS: Record<string, any> = {
  Zap,
  Calendar,
  ArrowRight,
  ShoppingCart,
  Wrench,
  CheckCircle2,
  Play,
  Briefcase,
  Info
};

const ALIGNMENTS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight }
];

const POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' }
];

const BUTTON_SHAPES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' }
];

const BUTTON_SIZES = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const COLORS = [
  { name: 'Brand Green', value: 'bg-primary' },
  { name: 'Professional Blue', value: 'bg-blue-600' },
  { name: 'Urgent Red', value: 'bg-red-600' },
  { name: 'Dark Slate', value: 'bg-slate-900' },
  { name: 'Warning Orange', value: 'bg-orange-500' },
  { name: 'Luxury Purple', value: 'bg-purple-600' },
  { name: 'Clean White', value: 'bg-white' }
];

const TEXT_COLORS = [
  { name: 'Pure White', value: 'text-white' },
  { name: 'Deep Black', value: 'text-gray-900' },
  { name: 'Brand Green', value: 'text-primary' },
  { name: 'Slate Gray', value: 'text-slate-600' }
];

export default function SiteCustomizePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  const heroRef = useMemoFirebase(() => db ? doc(db, 'heroBannerSettings', 'current') : null, [db]);
  
  const { data: customization, isLoading: customLoading } = useDoc(customizationRef);
  const { data: marqueeSettings, isLoading: marqueeLoading } = useDoc(marqueeRef);
  const { data: heroSettings, isLoading: heroLoading } = useDoc(heroRef);

  const [formData, setFormData] = useState<any>({
    hero: { 
      enabled: true,
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      buttonColor: 'bg-primary',
      buttonIcon: 'ArrowRight',
      alignment: 'center',
      images: [] 
    },
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
    height: 'h-5',
    radius: 'rounded-full',
    enabled: true,
    ctaText: '',
    ctaLink: ''
  });

  const [heroBannerData, setHeroBannerData] = useState<any>({
    titleText: 'PREMIUM CLEANING SERVICE',
    subtitleText: 'Expert solutions for home and office.',
    titleSize: 'text-4xl md:text-6xl',
    titleColor: 'text-white',
    textAlignment: 'center',
    textPosition: 'center',
    buttonText: 'Book Now',
    buttonLink: '/services',
    buttonSize: 'lg',
    buttonColor: 'bg-primary',
    buttonShape: 'pill',
    buttonPosition: 'center',
    overlayColor: 'bg-black',
    overlayOpacity: 0.5,
    isEnabled: true,
    isButtonEnabled: true,
    isTextEnabled: true
  });

  useEffect(() => {
    if (customization) {
      setFormData({
        ...formData,
        ...customization,
        hero: { 
          enabled: customization.hero?.enabled ?? true,
          title: customization.hero?.title || '',
          subtitle: customization.hero?.subtitle || '',
          buttonText: customization.hero?.buttonText || '',
          buttonLink: customization.hero?.buttonLink || '',
          buttonColor: customization.hero?.buttonColor || 'bg-primary',
          buttonIcon: customization.hero?.buttonIcon || 'ArrowRight',
          alignment: customization.hero?.alignment || 'center',
          images: customization.hero?.images || []
        },
        sections: { ...formData.sections, ...(customization.sections || {}) }
      });
    }
  }, [customization]);

  useEffect(() => {
    if (marqueeSettings) {
      setMarqueeData({ ...marqueeData, ...marqueeSettings });
    }
  }, [marqueeSettings]);

  useEffect(() => {
    if (heroSettings) {
      setHeroBannerData({ ...heroBannerData, ...heroSettings });
    }
  }, [heroSettings]);

  const handleSave = () => {
    if (!db) return;
    setIsSubmitting(true);
    
    const homeRef = doc(db, 'site_settings', 'homepage');
    const mqRef = doc(db, 'site_settings', 'marquee');
    const hbRef = doc(db, 'heroBannerSettings', 'current');

    Promise.all([
      setDoc(homeRef, formData, { merge: true }),
      setDoc(mqRef, marqueeData, { merge: true }),
      setDoc(hbRef, heroBannerData, { merge: true })
    ]).then(() => {
      toast({ title: "Customization Saved", description: "Your changes have been updated successfully." });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: homeRef.path,
        operation: 'write',
        requestResourceData: formData
      }));
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const addHeroImage = () => {
    setFormData({
      ...formData,
      hero: {
        ...formData.hero,
        images: [...formData.hero.images, { 
          imageUrl: '', 
          title: '', 
          subtitle: '', 
          ctaLink: '', 
          ctaText: '',
          btnColor: 'bg-primary',
          btnIcon: 'ArrowRight',
          alignment: 'center'
        }]
      }
    });
  };

  const removeHeroImage = (index: number) => {
    const updated = [...formData.hero.images];
    updated.splice(index, 1);
    setFormData({ ...formData, hero: { ...formData.hero, images: updated } });
  };

  if (customLoading || marqueeLoading || heroLoading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={40} /><span className="text-muted-foreground font-bold">Syncing Site Data...</span></div>;

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
           <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg text-primary-foreground bg-primary">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save All Changes
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero Layout
          </TabsTrigger>
          <TabsTrigger value="hero-content" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Type size={16} /> Hero Banner Settings
          </TabsTrigger>
          <TabsTrigger value="marquee" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BellRing size={16} /> Marquee
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Megaphone size={16} /> Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Slide Images (982x500)</CardTitle>
                <CardDescription>Manage the background visuals for your hero section</CardDescription>
              </div>
              <Button onClick={addHeroImage} size="sm" className="gap-2 font-bold">
                <Plus size={14} /> Add Background
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-8">
                {formData.hero.images.map((img: any, idx: number) => (
                  <div key={idx} className="p-6 border rounded-2xl space-y-6 relative bg-gray-50/30">
                    <div className="flex justify-between items-center border-b pb-4">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Slide #{idx + 1}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeHeroImage(idx)}><Trash2 size={16} /></Button>
                    </div>
                    <ImageUploader 
                      initialUrl={img.imageUrl}
                      aspectRatio="aspect-[982/500]"
                      onUpload={(url) => {
                        const updated = [...formData.hero.images];
                        updated[idx].imageUrl = url;
                        setFormData({...formData, hero: {...formData.hero, images: updated}});
                      }}
                      label="Slide Image"
                    />
                  </div>
                ))}
                {formData.hero.images.length === 0 && (
                  <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic bg-gray-50/50">
                    No images added. Using system default background.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero-content" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Management */}
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="text-primary" size={20} />
                  <div>
                    <CardTitle className="text-lg font-bold">Hero Text Management</CardTitle>
                    <CardDescription>Customize the main and subtitle messages</CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={heroBannerData.isTextEnabled} 
                  onCheckedChange={(val) => setHeroBannerData({...heroBannerData, isTextEnabled: val})} 
                />
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label>Main Title Text</Label>
                  <Input 
                    value={heroBannerData.titleText} 
                    onChange={(e) => setHeroBannerData({...heroBannerData, titleText: e.target.value})}
                    placeholder="e.g. PREMIUM CLEANING SERVICE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle / Description Text</Label>
                  <Textarea 
                    value={heroBannerData.subtitleText} 
                    onChange={(e) => setHeroBannerData({...heroBannerData, subtitleText: e.target.value})}
                    placeholder="Special offers or brand slogan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title Font Size</Label>
                    <Select value={heroBannerData.titleSize} onValueChange={(val) => setHeroBannerData({...heroBannerData, titleSize: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-2xl md:text-4xl">Small</SelectItem>
                        <SelectItem value="text-3xl md:text-5xl">Medium</SelectItem>
                        <SelectItem value="text-4xl md:text-6xl">Large (Default)</SelectItem>
                        <SelectItem value="text-5xl md:text-7xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Select value={heroBannerData.titleColor} onValueChange={(val) => setHeroBannerData({...heroBannerData, titleColor: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEXT_COLORS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <Select value={heroBannerData.textAlignment} onValueChange={(val) => setHeroBannerData({...heroBannerData, textAlignment: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALIGNMENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vertical Position</Label>
                    <Select value={heroBannerData.textPosition} onValueChange={(val) => setHeroBannerData({...heroBannerData, textPosition: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Button Management */}
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="text-primary" size={20} />
                  <div>
                    <CardTitle className="text-lg font-bold">Button Management</CardTitle>
                    <CardDescription>Customize the main call-to-action button</CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={heroBannerData.isButtonEnabled} 
                  onCheckedChange={(val) => setHeroBannerData({...heroBannerData, isButtonEnabled: val})} 
                />
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input 
                      value={heroBannerData.buttonText} 
                      onChange={(e) => setHeroBannerData({...heroBannerData, buttonText: e.target.value})}
                      placeholder="Book Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Link</Label>
                    <Input 
                      value={heroBannerData.buttonLink} 
                      onChange={(e) => setHeroBannerData({...heroBannerData, buttonLink: e.target.value})}
                      placeholder="/services"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Size</Label>
                    <Select value={heroBannerData.buttonSize} onValueChange={(val) => setHeroBannerData({...heroBannerData, buttonSize: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUTTON_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Button Color</Label>
                    <Select value={heroBannerData.buttonColor} onValueChange={(val) => setHeroBannerData({...heroBannerData, buttonColor: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLORS.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", c.value)} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Shape</Label>
                    <Select value={heroBannerData.buttonShape} onValueChange={(val) => setHeroBannerData({...heroBannerData, buttonShape: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUTTON_SHAPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Button Position</Label>
                    <Select value={heroBannerData.buttonPosition} onValueChange={(val) => setHeroBannerData({...heroBannerData, buttonPosition: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALIGNMENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overlay Settings */}
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden lg:col-span-2">
              <CardHeader className="bg-gray-50/50 border-b">
                <div className="flex items-center gap-2">
                  <Palette className="text-primary" size={20} />
                  <div>
                    <CardTitle className="text-lg font-bold">Background Overlay</CardTitle>
                    <CardDescription>Control the visual layering over the banner image</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Overlay Color</Label>
                      <Select value={heroBannerData.overlayColor} onValueChange={(val) => setHeroBannerData({...heroBannerData, overlayColor: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-black">True Black</SelectItem>
                          <SelectItem value="bg-gray-900">Dark Gray</SelectItem>
                          <SelectItem value="bg-primary">Brand Green</SelectItem>
                          <SelectItem value="bg-blue-900">Deep Blue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Overlay Opacity (0 to 1)</Label>
                      <div className="flex gap-4 items-center">
                        <Input 
                          type="number" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={heroBannerData.overlayOpacity} 
                          onChange={(e) => setHeroBannerData({...heroBannerData, overlayOpacity: parseFloat(e.target.value)})} 
                        />
                        <span className="text-xs font-bold text-muted-foreground">{heroBannerData.overlayOpacity * 100}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
                    <Info size={24} className="mx-auto text-primary opacity-40" />
                    <p className="text-xs font-medium text-muted-foreground italic">Overlays help maintain high contrast between text and background images.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <Label>Bar Height</Label>
                  <Select value={marqueeData.height || 'h-5'} onValueChange={(val) => setMarqueeData({...marqueeData, height: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h-5">Ultra Slim (20px)</SelectItem>
                      <SelectItem value="h-6">Very Slim (24px)</SelectItem>
                      <SelectItem value="h-8">Slim (32px)</SelectItem>
                      <SelectItem value="h-10">Standard (40px)</SelectItem>
                      <SelectItem value="h-12">Large (48px)</SelectItem>
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
