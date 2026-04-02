'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  ImageIcon, 
  Layout, 
  ChevronRight,
  Eye,
  ArrowUpCircle,
  Smartphone,
  Palette,
  MousePointer2,
  X,
  PlusCircle,
  List,
  Home,
  MessageCircle,
  ShoppingCart,
  User,
  Grid,
  Layers,
  Box,
  Info,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ICONS: Record<string, any> = {
  Home,
  MessageCircle,
  ShoppingCart,
  User,
  Grid,
  Layers,
  Box,
  Package
};

const DEFAULT_LINKS = [
  { id: 'l1', label: 'হোম', icon: 'Home', link: '/', order: 0 },
  { id: 'l2', label: 'মেসেজ', icon: 'MessageCircle', link: '#', order: 1 },
  { id: 'l3', label: 'কার্ট', icon: 'ShoppingCart', link: '/cart', order: 2 },
  { id: 'l4', label: 'একাউন্ট', icon: 'User', link: '/account/dashboard', order: 3 },
];

export default function BottomNavManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  const offersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'offers'), orderBy('order', 'asc')) : null, [db]);
  const { data: offers, isLoading: offersLoading } = useCollection(offersQuery);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'bottom_nav') : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(configRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const productsEnabled = settings?.productsEnabled !== false;

  const [formData, setFormData] = useState<any>({
    bgColor: '#ffffff',
    activeColor: '#1E5F7A',
    inactiveColor: '#9ca3af',
    showOfferCircle: true,
    showPackage: true,
    links: DEFAULT_LINKS
  });

  const [offerFormData, setOfferFormData] = useState({
    image: '',
    link: '',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    if (config) {
      setFormData({
        ...formData,
        ...config,
        links: config.links || DEFAULT_LINKS,
        showPackage: config.showPackage ?? true
      });
    }
  }, [config]);

  const handleSaveConfig = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'bottom_nav'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Configuration Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !offerFormData.image) return;
    setIsOfferSubmitting(true);
    try {
      if (editingOfferId) {
        await updateDoc(doc(db, 'offers', editingOfferId), { ...offerFormData, updatedAt: new Date().toISOString() });
        toast({ title: "Offer Updated" });
      } else {
        await addDoc(collection(db, 'offers'), { ...offerFormData, createdAt: new Date().toISOString() });
        toast({ title: "Offer Added" });
      }
      resetOfferForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const resetOfferForm = () => {
    setOfferFormData({ image: '', link: '', isActive: true, order: (offers?.length || 0) + 1 });
    setEditingOfferId(null);
  };

  const updateLink = (idx: number, field: string, val: string) => {
    const next = [...formData.links];
    next[idx] = { ...next[idx], [field]: val };
    setFormData({ ...formData, links: next });
  };

  const removeLink = (idx: number) => {
    const next = formData.links.filter((_:any, i:number) => i !== idx);
    setFormData({ ...formData, links: next });
  };

  const addLink = () => {
    setFormData({ 
      ...formData, 
      links: [...formData.links, { id: Math.random().toString(36).substr(2, 9), label: 'New Link', icon: 'Grid', link: '#', order: formData.links.length }] 
    });
  };

  if (configLoading || offersLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Bottom Navbar Hub</h1>
          <p className="text-muted-foreground text-sm">Control colors, static links, and circular offers</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Publish Changes
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Info size={20}/></div>
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase text-blue-900">Automatic Logic Active</h4>
          <p className="text-xs text-blue-800/70 leading-relaxed">
            সিস্টেম অটোমেশন অন আছে: যদি <strong>Settings {'>'} Products Enabled</strong> অফ থাকে, তবে স্বয়ংক্রিয়ভাবে নেভিগেশন বার থেকে "কার্ট" হাইড হবে এবং "মেসেজ" বাটনটি বটম নেভিগেশনে যুক্ত হবে। উল্টোটি ঘটলে "মেসেজ" হাইড হবে এবং "কার্ট" দৃশ্যমান হবে।
          </p>
        </div>
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="links" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <List size={16} /> Static Buttons
          </TabsTrigger>
          <TabsTrigger value="offers" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ArrowUpCircle size={16} /> Circular Offers
          </TabsTrigger>
          <TabsTrigger value="style" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette size={16} /> Visual Theme
          </TabsTrigger>
        </TabsList>

        {/* STATIC BUTTONS */}
        <TabsContent value="links" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black uppercase">Navigation Buttons</CardTitle>
                <CardDescription className="text-xs">Standard buttons shown on both sides of the middle offer</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Package Button</Label>
                  <Switch checked={formData.showPackage} onCheckedChange={v => setFormData({...formData, showPackage: v})} />
                </div>
                <Button onClick={addLink} variant="outline" size="sm" className="rounded-xl font-bold border-primary/20 text-primary uppercase text-[10px] h-10">
                  <PlusCircle size={14} className="mr-1.5" /> Add Custom Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.links.map((link: any, i: number) => (
                  <div key={link.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 group relative">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">Pos {i + 1}</Badge>
                      <button onClick={() => removeLink(i)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Label</Label>
                        <Input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} className="h-9 bg-white border-none text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Icon Keyword</Label>
                        <Input value={link.icon} onChange={e => updateLink(i, 'icon', e.target.value)} className="h-9 bg-white border-none text-xs font-mono" placeholder="ShoppingCart, Home, Layers, etc." />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-gray-400">Destination URL</Label>
                      <Input value={link.link} onChange={e => updateLink(i, 'link', e.target.value)} className="h-9 bg-white border-none text-xs font-bold text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CIRCULAR OFFERS */}
        <TabsContent value="offers" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm h-fit bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-[#081621] text-white p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                    <Smartphone size={20} /> {editingOfferId ? 'Update Offer' : 'Add New Offer'}
                  </CardTitle>
                  <Switch checked={formData.showOfferCircle} onCheckedChange={v => setFormData({...formData, showOfferCircle: v})} />
                </div>
                <CardDescription className="text-white/40 uppercase font-bold text-[9px]">Toggle middle rotating offers</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleOfferSubmit} className="space-y-6">
                  <ImageUploader 
                    label="Offer Image (1:1 Circle)" 
                    hint="200 x 200 px"
                    initialUrl={offerFormData.image} 
                    onUpload={url => setOfferFormData({...offerFormData, image: url})} 
                    aspectRatio="aspect-square w-24 mx-auto" 
                  />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Redirect Link</Label>
                    <Input value={offerFormData.link} onChange={e => setOfferFormData({...offerFormData, link: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" placeholder="/services" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Order</Label>
                      <Input type="number" value={offerFormData.order} onChange={e => setOfferFormData({...offerFormData, order: parseInt(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Active</Label>
                      <div className="h-12 flex items-center justify-center bg-gray-50 rounded-xl"><Switch checked={offerFormData.isActive} onCheckedChange={v => setOfferFormData({...offerFormData, isActive: v})} /></div>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button type="submit" disabled={isOfferSubmitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                      {isOfferSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                      {editingOfferId ? 'Update' : 'Add to Rotation'}
                    </Button>
                    {editingOfferId && <Button type="button" variant="ghost" className="h-14 rounded-2xl" onClick={resetOfferForm}>Cancel</Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-7 space-y-4">
            {offers?.map(offer => (
              <Card key={offer.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100 transition-all", !offer.isActive && "opacity-50 grayscale")}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full border-2 border-primary/10 overflow-hidden shrink-0 shadow-inner">
                      <Image src={offer.image} alt="Offer" fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 uppercase text-xs">POS: {offer.order}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{offer.link}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => { setEditingOfferId(offer.id); setOfferFormData(offer); }}><Edit size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => deleteDoc(doc(db!, 'offers', offer.id))}><Trash2 size={16}/></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* VISUAL THEME */}
        <TabsContent value="style" className="max-w-3xl mx-auto space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Navbar Aesthetics</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Background Color</Label>
                  <Input type="color" value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="h-12 p-1 bg-white border-gray-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Active Item Color</Label>
                  <Input type="color" value={formData.activeColor} onChange={e => setFormData({...formData, activeColor: e.target.value})} className="h-12 p-1 bg-white border-gray-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Inactive Item Color</Label>
                  <Input type="color" value={formData.inactiveColor} onChange={e => setFormData({...formData, inactiveColor: e.target.value})} className="h-12 p-1 bg-white border-gray-100 rounded-xl" />
                </div>
              </div>

              <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Visual Simulation</p>
                <div 
                  className="w-full max-w-[350px] h-16 rounded-full shadow-2xl flex items-center justify-around px-6 border border-gray-100"
                  style={{ backgroundColor: formData.bgColor }}
                >
                  <div className="p-2 rounded-xl" style={{ backgroundColor: formData.activeColor, color: '#fff' }}><Home size={18}/></div>
                  <div className="p-2" style={{ color: formData.inactiveColor }}><Box size={18}/></div>
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-xl bg-gray-300" />
                  <div className="p-2" style={{ color: formData.inactiveColor }}><ShoppingCart size={18}/></div>
                  <div className="p-2" style={{ color: formData.inactiveColor }}><User size={18}/></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
