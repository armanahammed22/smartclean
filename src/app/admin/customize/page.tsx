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
  AlignRight
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

const COLORS = [
  { name: 'Brand Green', value: 'bg-primary' },
  { name: 'Professional Blue', value: 'bg-blue-600' },
  { name: 'Urgent Red', value: 'bg-red-600' },
  { name: 'Dark Slate', value: 'bg-slate-900' },
  { name: 'Warning Orange', value: 'bg-orange-500' },
  { name: 'Luxury Purple', value: 'bg-purple-600' }
];

export default function SiteCustomizePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  
  const { data: customization, isLoading: customLoading } = useDoc(customizationRef);
  const { data: marqueeSettings, isLoading: marqueeLoading } = useDoc(marqueeRef);

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

  const handleSave = () => {
    if (!db) return;
    setIsSubmitting(true);
    
    const homeRef = doc(db, 'site_settings', 'homepage');
    const mqRef = doc(db, 'site_settings', 'marquee');

    Promise.all([
      setDoc(homeRef, formData, { merge: true }),
      setDoc(mqRef, marqueeData, { merge: true })
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
           <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg text-primary-foreground bg-primary">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save All Changes
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero Section
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
                <CardTitle className="text-lg font-bold">Global Hero Fallback</CardTitle>
                <CardDescription>Default text and button settings when no slides are active</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold">Show Hero Section</Label>
                <Switch 
                  checked={formData.hero.enabled} 
                  onCheckedChange={(val) => setFormData({...formData, hero: {...formData.hero, enabled: val}})} 
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Title</Label>
                  <Input 
                    value={formData.hero.title} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, title: e.target.value}})}
                    placeholder="Main heading text"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Subtitle</Label>
                  <Input 
                    value={formData.hero.subtitle} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, subtitle: e.target.value}})}
                    placeholder="Small text below heading"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input 
                    value={formData.hero.buttonText} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, buttonText: e.target.value}})}
                    placeholder="e.g. Book Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input 
                    value={formData.hero.buttonLink} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, buttonLink: e.target.value}})}
                    placeholder="e.g. /services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <Select value={formData.hero.buttonColor} onValueChange={(val) => setFormData({...formData, hero: {...formData.hero, buttonColor: val}})}>
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
                <div className="space-y-2">
                  <Label>Button Icon</Label>
                  <Select value={formData.hero.buttonIcon} onValueChange={(val) => setFormData({...formData, hero: {...formData.hero, buttonIcon: val}})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(BUTTON_ICONS).map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Alignment</Label>
                  <div className="flex gap-2">
                    {ALIGNMENTS.map(a => (
                      <Button
                        key={a.value}
                        variant={formData.hero.alignment === a.value ? 'default' : 'outline'}
                        className="flex-1 gap-2"
                        onClick={() => setFormData({...formData, hero: {...formData.hero, alignment: a.value}})}
                      >
                        <a.icon size={16} /> {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Carousel Slides (982x500)</CardTitle>
                <CardDescription>Add and customize multiple hero slides</CardDescription>
              </div>
              <Button onClick={addHeroImage} size="sm" className="gap-2 font-bold">
                <Plus size={14} /> Add Slide
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-4">
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
                      
                      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Slide Title (Optional)</Label>
                          <Input 
                            value={img.title} 
                            onChange={(e) => {
                              const updated = [...formData.hero.images];
                              updated[idx].title = e.target.value;
                              setFormData({...formData, hero: {...formData.hero, images: updated}});
                            }}
                            placeholder="Slide-specific title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slide Subtitle (Optional)</Label>
                          <Input 
                            value={img.subtitle} 
                            onChange={(e) => {
                              const updated = [...formData.hero.images];
                              updated[idx].subtitle = e.target.value;
                              setFormData({...formData, hero: {...formData.hero, images: updated}});
                            }}
                            placeholder="Slide-specific subtitle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CTA Link</Label>
                          <Input 
                            value={img.ctaLink} 
                            onChange={(e) => {
                              const updated = [...formData.hero.images];
                              updated[idx].ctaLink = e.target.value;
                              setFormData({...formData, hero: {...formData.hero, images: updated}});
                            }}
                            placeholder="/services"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Button Text</Label>
                          <Input 
                            value={img.ctaText} 
                            onChange={(e) => {
                              const updated = [...formData.hero.images];
                              updated[idx].ctaText = e.target.value;
                              setFormData({...formData, hero: {...formData.hero, images: updated}});
                            }}
                            placeholder="Book Now"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Button Color</Label>
                          <Select value={img.btnColor || 'bg-primary'} onValueChange={(val) => {
                            const updated = [...formData.hero.images];
                            updated[idx].btnColor = val;
                            setFormData({...formData, hero: {...formData.hero, images: updated}});
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Content Alignment</Label>
                          <Select value={img.alignment || 'center'} onValueChange={(val) => {
                            const updated = [...formData.hero.images];
                            updated[idx].alignment = val;
                            setFormData({...formData, hero: {...formData.hero, images: updated}});
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALIGNMENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {formData.hero.images.length === 0 && (
                  <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic bg-gray-50/50">
                    No slides added. Using global hero fallback.
                  </div>
                )}
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
