
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, orderBy } from 'firebase/firestore';
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
  CheckCircle2, 
  Plus, 
  Save, 
  Eye, 
  MousePointer2, 
  Smartphone,
  Star,
  Package,
  Wrench,
  Loader2,
  TicketPercent,
  Trash2,
  ListOrdered,
  Megaphone
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export default function SiteCustomizePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization, isLoading } = useDoc(customizationRef);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);

  const [formData, setFormData] = useState<any>({
    hero: { title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '', enabled: true },
    sections: { 
      popularProducts: true, 
      recentProducts: true, 
      bestSellingProducts: true,
      popularServices: true, 
      recentServices: true, 
      bestSellingServices: true,
      campaigns: true,
      offerBanners: true,
      customContent: true
    },
    offerBanners: [],
    campaigns: [],
    featuredProductIds: [],
    featuredServiceIds: [],
    marketingContent: ''
  });

  useEffect(() => {
    if (customization) {
      setFormData({
        ...formData,
        ...customization,
        sections: { ...formData.sections, ...(customization.sections || {}) }
      });
    }
  }, [customization]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'homepage'), formData, { merge: true });
      toast({ title: "Customization Saved", description: "Your homepage has been updated." });
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

  const addCampaign = () => {
    setFormData({
      ...formData,
      campaigns: [...(formData.campaigns || []), { title: '', description: '', imageUrl: '', enabled: true }]
    });
  };

  const removeCampaign = (index: number) => {
    const updated = [...formData.campaigns];
    updated.splice(index, 1);
    setFormData({ ...formData, campaigns: updated });
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Syncing...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Customize</h1>
          <p className="text-muted-foreground text-sm">Control your homepage layout and featured sections</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <a href="/" target="_blank"><Eye size={16} /> View Live Site</a>
           </Button>
           <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Changes
           </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero
          </TabsTrigger>
          <TabsTrigger value="sections" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Smartphone size={16} /> Sections
          </TabsTrigger>
          <TabsTrigger value="banners" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ImageIcon size={16} /> Banners
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <TicketPercent size={16} /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="featured" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Star size={16} /> Featured
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Megaphone size={16} /> Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Main Hero Banner</CardTitle>
                <CardDescription>Primary headline and images for the landing page</CardDescription>
              </div>
              <Switch 
                checked={formData.hero.enabled} 
                onCheckedChange={(val) => setFormData({...formData, hero: {...formData.hero, enabled: val}})} 
              />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input 
                    value={formData.hero.title} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, title: e.target.value}})}
                    placeholder="e.g. Smart solutions for a clean life"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub-headline</Label>
                  <Input 
                    value={formData.hero.subtitle} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, subtitle: e.target.value}})}
                    placeholder="e.g. Expert cleaning services in Bangladesh"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <Input 
                    value={formData.hero.imageUrl} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, imageUrl: e.target.value}})}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input 
                      value={formData.hero.ctaText} 
                      onChange={(e) => setFormData({...formData, hero: {...formData.hero, ctaText: e.target.value}})}
                      placeholder="Book Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Link</Label>
                    <Input 
                      value={formData.hero.ctaLink} 
                      onChange={(e) => setFormData({...formData, hero: {...formData.hero, ctaLink: e.target.value}})}
                      placeholder="/#services"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Product Sections</CardTitle>
                <CardDescription>Default Product display grids</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'popularProducts', label: 'Popular Products', icon: Package },
                  { id: 'recentProducts', label: 'Recent Products', icon: Plus },
                  { id: 'bestSellingProducts', label: 'Best Selling Products', icon: Star },
                ].map((sec) => (
                  <div key={sec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-primary shadow-sm"><sec.icon size={18} /></div>
                      <span className="text-sm font-bold">{sec.label}</span>
                    </div>
                    <Switch 
                      checked={formData.sections[sec.id]} 
                      onCheckedChange={(val) => setFormData({
                        ...formData, 
                        sections: { ...formData.sections, [sec.id]: val }
                      })} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Service Sections</CardTitle>
                <CardDescription>Default Service display grids</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'popularServices', label: 'Popular Services', icon: Wrench },
                  { id: 'recentServices', label: 'Recent Services', icon: Plus },
                  { id: 'bestSellingServices', label: 'Best Selling Services', icon: Star },
                ].map((sec) => (
                  <div key={sec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-primary shadow-sm"><sec.icon size={18} /></div>
                      <span className="text-sm font-bold">{sec.label}</span>
                    </div>
                    <Switch 
                      checked={formData.sections[sec.id]} 
                      onCheckedChange={(val) => setFormData({
                        ...formData, 
                        sections: { ...formData.sections, [sec.id]: val }
                      })} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
              {(!formData.offerBanners || formData.offerBanners.length === 0) && (
                <div className="text-center py-10 text-muted-foreground italic">No offer banners configured.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Marketing Campaigns</CardTitle>
                <CardDescription>Manage active promotional campaigns</CardDescription>
              </div>
              <Button onClick={addCampaign} variant="outline" className="gap-2 font-bold">
                <Plus size={16} /> New Campaign
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {formData.campaigns?.map((camp: any, idx: number) => (
                <div key={idx} className="p-6 border rounded-2xl space-y-4 relative bg-gray-50/30">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-destructive"
                    onClick={() => removeCampaign(idx)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Campaign Title</Label>
                      <Input 
                        value={camp.title} 
                        onChange={(e) => {
                          const updated = [...formData.campaigns];
                          updated[idx].title = e.target.value;
                          setFormData({...formData, campaigns: updated});
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Campaign Image</Label>
                      <Input 
                        value={camp.imageUrl} 
                        onChange={(e) => {
                          const updated = [...formData.campaigns];
                          updated[idx].imageUrl = e.target.value;
                          setFormData({...formData, campaigns: updated});
                        }}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={camp.description} 
                        onChange={(e) => {
                          const updated = [...formData.campaigns];
                          updated[idx].description = e.target.value;
                          setFormData({...formData, campaigns: updated});
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Featured Products</CardTitle>
                <CardDescription>Manually select products for the homepage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {products?.map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                      <Checkbox 
                        id={`prod-${p.id}`} 
                        checked={formData.featuredProductIds?.includes(p.id)}
                        onCheckedChange={(checked) => {
                          const updated = checked 
                            ? [...(formData.featuredProductIds || []), p.id]
                            : (formData.featuredProductIds || []).filter((id: string) => id !== p.id);
                          setFormData({...formData, featuredProductIds: updated});
                        }}
                      />
                      <Label htmlFor={`prod-${p.id}`} className="flex-1 cursor-pointer">
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">৳{p.price}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Featured Services</CardTitle>
                <CardDescription>Highlight specific cleaning services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {services?.map(s => (
                    <div key={s.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                      <Checkbox 
                        id={`serv-${s.id}`} 
                        checked={formData.featuredServiceIds?.includes(s.id)}
                        onCheckedChange={(checked) => {
                          const updated = checked 
                            ? [...(formData.featuredServiceIds || []), s.id]
                            : (formData.featuredServiceIds || []).filter((id: string) => id !== s.id);
                          setFormData({...formData, featuredServiceIds: updated});
                        }}
                      />
                      <Label htmlFor={`serv-${s.id}`} className="flex-1 cursor-pointer">
                        <p className="font-bold text-sm">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">৳{s.basePrice}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
