
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
  TicketPercent
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
    hero: { title: '', subtitle: '', imageUrl: '', ctaText: '', enabled: true },
    sections: { popularProducts: true, recentProducts: true, popularServices: true, campaigns: true },
    featuredProductIds: [],
    featuredServiceIds: []
  });

  useEffect(() => {
    if (customization) {
      setFormData(customization);
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
        <TabsList className="bg-white border p-1 h-12 rounded-xl">
          <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Hero Section
          </TabsTrigger>
          <TabsTrigger value="sections" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Smartphone size={16} /> Layout Sections
          </TabsTrigger>
          <TabsTrigger value="featured" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Star size={16} /> Featured Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">Main Hero Banner</CardTitle>
                  <CardDescription>Primary headline and images for the public landing page</CardDescription>
                </div>
                <Switch 
                  checked={formData.hero.enabled} 
                  onCheckedChange={(val) => setFormData({...formData, hero: {...formData.hero, enabled: val}})} 
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Headline (Bengali or English)</Label>
                  <Input 
                    value={formData.hero.title} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, title: e.target.value}})}
                    placeholder="e.g. আপনি কি ক্লিনিং সার্ভিস নিতে চাচ্ছেন?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub-headline</Label>
                  <Input 
                    value={formData.hero.subtitle} 
                    onChange={(e) => setFormData({...formData, hero: {...formData.hero, subtitle: e.target.value}})}
                    placeholder="e.g. Smart Clean নিয়ে এলো সম্পূর্ণ প্রফেশনাল ক্লিনিং সার্ভিস"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.hero.imageUrl} 
                      onChange={(e) => setFormData({...formData, hero: {...formData.hero, imageUrl: e.target.value}})}
                      placeholder="https://picsum.photos/seed/tech/1200/600"
                    />
                    <Button variant="outline" size="icon"><ImageIcon size={18} /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Call to Action Text</Label>
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

        <TabsContent value="sections">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Section Toggles</CardTitle>
                <CardDescription>Enable or disable major homepage components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'popularProducts', label: 'Popular Products Grid', icon: Package },
                  { id: 'recentProducts', label: 'Recently Added Products', icon: Plus },
                  { id: 'popularServices', label: 'Best Selling Services', icon: Wrench },
                  { id: 'campaigns', label: 'Marketing Banners & Campaigns', icon: TicketPercent },
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

            <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
                <Layout size={120} />
              </div>
              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit"><MousePointer2 size={32} /></div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Layout Control</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Toggle sections to keep your homepage focused. You can hide products if you want to focus strictly on services during specific seasons.
                </p>
                <div className="pt-4 flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><CheckCircle2 size={14} /> Auto-Sync</div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><CheckCircle2 size={14} /> Mobile First</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Select Featured Products</CardTitle>
                <CardDescription>Manually pick products to display in the Best Selling section</CardDescription>
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
                        <p className="text-[10px] text-muted-foreground uppercase">Price: ৳{p.price}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Select Featured Services</CardTitle>
                <CardDescription>Highlight specific cleaning services on the homepage</CardDescription>
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
                        <p className="text-[10px] text-muted-foreground uppercase">Price: ৳{s.basePrice}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
