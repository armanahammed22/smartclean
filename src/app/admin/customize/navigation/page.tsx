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
  Package,
  Settings2,
  Navigation,
  MoveUp,
  MoveDown,
  Link as LinkIcon,
  CircleEllipsis,
  ExternalLink,
  CreditCard,
  Compass
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import * as LucideIcons from 'lucide-react';

const ICONS: Record<string, any> = {
  Home,
  MessageCircle,
  ShoppingCart,
  User,
  Grid,
  Layers,
  Box,
  Package,
  CreditCard,
  Zap: LucideIcons.Zap,
  Star: LucideIcons.Star,
  Settings: LucideIcons.Settings,
  ShieldCheck: LucideIcons.ShieldCheck,
  Award: LucideIcons.Award,
  Video: LucideIcons.Video,
  Camera: LucideIcons.Camera,
  Tv: LucideIcons.Tv,
  Monitor: LucideIcons.Monitor,
  Laptop: LucideIcons.Laptop
};

const DEFAULT_LINKS = [
  { id: 'l1', label: 'হোম', icon: 'Home', link: '/', order: 0, isEnabled: true, color: '#1E5F7A' },
  { id: 'l2', label: 'মেসেজ', icon: 'MessageCircle', link: '#', order: 1, isEnabled: true, color: '#1E5F7A' },
  { id: 'l3', label: 'কার্ট', icon: 'ShoppingCart', link: '/cart', order: 2, isEnabled: true, color: '#1E5F7A' },
  { id: 'l4', label: 'একাউন্ট', icon: 'User', link: '/account/dashboard', order: 3, isEnabled: true, color: '#1E5F7A' },
];

const GRADIENTS = [
  { name: 'Green (Primary)', value: 'from-primary to-primary/80' },
  { name: 'Dark Slate', value: 'from-[#081621] to-[#0a253a]' },
  { name: 'Blue-Indigo', value: 'from-blue-500 to-indigo-600' },
  { name: 'Orange-Red', value: 'from-orange-500 to-red-600' },
  { name: 'Purple-Pink', value: 'from-purple-500 to-pink-600' }
];

export default function NavigationHubPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeHubTab, setActiveHubTab] = useState('bottom_nav');

  // Bottom Nav States
  const [isSavingBottom, setIsSavingBottom] = useState(false);
  const bottomConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'bottom_nav') : null, [db]);
  const { data: bottomConfig, isLoading: bottomLoading } = useDoc(bottomConfigRef);
  const [bottomFormData, setBottomFormData] = useState<any>({
    bgColor: '#ffffff',
    activeColor: '#1E5F7A',
    inactiveColor: '#9ca3af',
    showOfferCircle: true,
    showPackage: true,
    packageConfig: { label: 'প্যাকেজ', icon: 'Layers', color: '#1E5F7A', isEnabled: true, href: '/services' },
    links: DEFAULT_LINKS
  });

  // Top Nav States
  const [topFormData, setTopFormData] = useState({ name: '', link: '', order: 0 });
  const [isTopSubmitting, setIsTopSubmitting] = useState(false);
  const topCatsQuery = useMemoFirebase(() => db ? query(collection(db, 'top_nav_categories'), orderBy('order', 'asc')) : null, [db]);
  const { data: topCategories, isLoading: topLoading } = useCollection(topCatsQuery);

  // Icon Grid (Quick Links) States
  const [linkFormData, setLinkFormData] = useState({ label: '', iconName: 'Grid', imageUrl: '', link: '', order: 0 });
  const [isLinkSubmitting, setIsLinkSubmitting] = useState(false);
  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks, isLoading: linksLoading } = useCollection(linksQuery);

  // Feature Cards (Quick Actions) States
  const [actionFormData, setActionFormData] = useState({ title: '', iconName: 'Wrench', link: '', bgGradient: 'from-primary to-primary/80' });
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const actionsQuery = useMemoFirebase(() => db ? collection(db, 'quick_actions') : null, [db]);
  const { data: quickActions, isLoading: actionsLoading } = useCollection(actionsQuery);

  useEffect(() => {
    if (bottomConfig) {
      setBottomFormData({
        ...bottomFormData,
        ...bottomConfig,
        links: bottomConfig.links || DEFAULT_LINKS,
        packageConfig: { ...bottomFormData.packageConfig, ...(bottomConfig.packageConfig || {}) }
      });
    }
  }, [bottomConfig]);

  // BOTTOM NAV HANDLERS
  const handleSaveBottom = async () => {
    if (!db) return;
    setIsSavingBottom(true);
    try {
      await setDoc(doc(db, 'site_settings', 'bottom_nav'), { ...bottomFormData, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Bottom Nav Published" });
    } catch (e) { toast({ variant: "destructive", title: "Save Failed" }); }
    finally { setIsSavingBottom(false); }
  };

  const updateBottomLink = (idx: number, field: string, val: any) => {
    const next = [...bottomFormData.links];
    next[idx] = { ...next[idx], [field]: val };
    setBottomFormData({ ...bottomFormData, links: next });
  };

  // TOP NAV HANDLERS
  const handleAddTop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !topFormData.name) return;
    setIsTopSubmitting(true);
    try {
      await addDoc(collection(db, 'top_nav_categories'), { ...topFormData, order: Number(topFormData.order) || (topCategories?.length || 0) + 1 });
      setTopFormData({ name: '', link: '', order: 0 });
      toast({ title: "Category Added" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsTopSubmitting(false); }
  };

  const updateTopOrder = async (id: string, newOrder: number) => {
    if (!db) return;
    await updateDoc(doc(db, 'top_nav_categories', id), { order: newOrder });
  };

  // QUICK LINKS HANDLERS
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !linkFormData.label) return;
    setIsLinkSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_links'), { ...linkFormData, order: Number(linkFormData.order) });
      setLinkFormData({ label: '', iconName: 'Grid', imageUrl: '', link: '', order: 0 });
      toast({ title: "Quick Link Added" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsLinkSubmitting(false); }
  };

  // QUICK ACTIONS HANDLERS
  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !actionFormData.title) return;
    setIsActionSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_actions'), actionFormData);
      setActionFormData({ title: '', iconName: 'Wrench', link: '', bgGradient: 'from-primary to-primary/80' });
      toast({ title: "Action Card Added" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsActionSubmitting(false); }
  };

  if (bottomLoading || topLoading || linksLoading || actionsLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Navigation & Interface Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Consolidated control for navbars, icon grids, and call-to-action cards</p>
        </div>
      </div>

      <Tabs value={activeHubTab} onValueChange={setActiveHubTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap shadow-sm">
          <TabsTrigger value="bottom_nav" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white"><CircleEllipsis size={14}/> Bottom Navbar</TabsTrigger>
          <TabsTrigger value="top_nav" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white"><Navigation size={14}/> Top Links</TabsTrigger>
          <TabsTrigger value="icon_grid" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white"><Grid size={14}/> Icon Grid</TabsTrigger>
          <TabsTrigger value="feature_cards" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white"><Layout size={14}/> Feature Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="bottom_nav" className="mt-0 space-y-8">
          <div className="flex justify-end">
            <Button onClick={handleSaveBottom} disabled={isSavingBottom} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20">
              {isSavingBottom ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Bottom Nav
            </Button>
          </div>

          <Tabs defaultValue="links" className="space-y-6">
            <TabsList className="bg-gray-100 p-1 h-10 rounded-lg">
              <TabsTrigger value="links" className="text-[9px] uppercase font-black">Icon Controls</TabsTrigger>
              <TabsTrigger value="package" className="text-[9px] uppercase font-black">Package Toggle</TabsTrigger>
              <TabsTrigger value="style" className="text-[9px] uppercase font-black">Style & Themes</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bottomFormData.links.map((link: any, i: number) => (
                  <Card key={link.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                    <CardHeader className="bg-gray-50/50 p-5 border-b flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">POS {i + 1}</Badge>
                        <CardTitle className="text-sm font-black uppercase">{link.label}</CardTitle>
                      </div>
                      <Switch checked={link.isEnabled !== false} onCheckedChange={v => updateBottomLink(i, 'isEnabled', v)} className="scale-75" />
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Label</Label>
                        <Input value={link.label} onChange={e => updateBottomLink(i, 'label', e.target.value)} className="h-9 bg-gray-50 border-none font-bold text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Icon Key</Label>
                        <Input value={link.icon} onChange={e => updateBottomLink(i, 'icon', e.target.value)} className="h-9 bg-gray-50 border-none font-mono text-xs" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="package" className="mt-0 max-w-2xl mx-auto">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2"><Layers className="text-primary"/> Package Logic</CardTitle>
                    <Switch checked={bottomFormData.showPackage} onCheckedChange={v => setBottomFormData({...bottomFormData, showPackage: v})} />
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Label</Label>
                      <Input value={bottomFormData.packageConfig?.label} onChange={e => setBottomFormData({...bottomFormData, packageConfig: {...bottomFormData.packageConfig, label: e.target.value}})} className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Active Feature Target</Label>
                      <Select
                        value={bottomFormData.packageConfig?.href || '/services'}
                        onValueChange={v => setBottomFormData({...bottomFormData, packageConfig: {...bottomFormData.packageConfig, href: v}})}
                      >
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold">
                          <SelectValue placeholder="Select Target..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="/services" className="font-bold text-[10px] uppercase">Service Catalog</SelectItem>
                          <SelectItem value="/billing" className="font-bold text-[10px] uppercase">Billing & Plan (Live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Icon (Lucide)</Label>
                      <Input value={bottomFormData.packageConfig?.icon} onChange={e => setBottomFormData({...bottomFormData, packageConfig: {...bottomFormData.packageConfig, icon: e.target.value}})} className="h-11 bg-gray-50 border-none rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Custom Color</Label>
                      <Input type="color" value={bottomFormData.packageConfig?.color} onChange={e => setBottomFormData({...bottomFormData, packageConfig: {...bottomFormData.packageConfig, color: e.target.value}})} className="h-11 p-1 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-blue-800 leading-relaxed">
                      "Billing & Plan (Live)" অপশনটি সিলেক্ট করলে প্যাকেজ আইকনে ক্লিক করলে ইউজার আপনার সাবস্ক্রিপশন প্ল্যানগুলো দেখতে পাবে।
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden">
                  <CardHeader><CardTitle className="text-base font-black uppercase tracking-widest text-primary">Nav Theme</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-white/40 uppercase">Global Active Color</Label>
                      <Input type="color" value={bottomFormData.activeColor} onChange={e => setBottomFormData({...bottomFormData, activeColor: e.target.value})} className="h-10 p-1 bg-white/10 border-none" />
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-xs font-black uppercase">Rotating Offer Circle</Label>
                        <Switch checked={bottomFormData.showOfferCircle} onCheckedChange={v => setBottomFormData({...bottomFormData, showOfferCircle: v})} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="top_nav" className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-fit">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-base font-black uppercase">Add Link</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-4">
                <form onSubmit={handleAddTop} className="space-y-4">
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-gray-400">Label</Label><Input value={topFormData.name} onChange={e => setTopFormData({...topFormData, name: e.target.value})} required className="h-10 bg-gray-50 border-none font-bold" /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-gray-400">URL</Label><Input value={topFormData.link} onChange={e => setTopFormData({...topFormData, link: e.target.value})} className="h-10 bg-gray-50 border-none font-mono text-xs" /></div>
                  <Button type="submit" disabled={isTopSubmitting} className="w-full font-black uppercase text-xs h-11 shadow-lg">{isTopSubmitting ? <Loader2 className="animate-spin"/> : "Add Top Link"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-8 space-y-3">
            {topCategories?.map((cat) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-black text-xs">{cat.order}</div>
                  <div><p className="font-black text-xs uppercase text-gray-900">{cat.name}</p><p className="text-[9px] font-mono text-gray-400">{cat.link}</p></div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTopOrder(cat.id, (cat.order || 0) - 1)}><MoveUp size={14}/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTopOrder(cat.id, (cat.order || 0) + 1)}><MoveDown size={14}/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'top_nav_categories', cat.id))}><Trash2 size={14}/></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="icon_grid" className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-fit">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-base font-black uppercase">Add Grid Item</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                <form onSubmit={handleAddLink} className="space-y-6">
                  <ImageUploader label="Icon Asset" initialUrl={linkFormData.imageUrl} onUpload={url => setLinkFormData({...linkFormData, imageUrl: url})} aspectRatio="aspect-square w-20 mx-auto" />
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Label</Label><Input value={linkFormData.label} onChange={e => setLinkFormData({...linkFormData, label: e.target.value})} className="h-10 bg-gray-50 border-none font-bold" /></div>
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Target URL</Label><Input value={linkFormData.link} onChange={e => setLinkFormData({...linkFormData, link: e.target.value})} className="h-10 bg-gray-50 border-none font-mono text-xs" /></div>
                  </div>
                  <Button type="submit" disabled={isLinkSubmitting} className="w-full font-black h-11 shadow-lg bg-primary text-white">{isLinkSubmitting ? <Loader2 className="animate-spin"/> : "Add to Grid"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks?.map(link => (
              <Card key={link.id} className="border-none shadow-sm bg-white rounded-2xl group border border-gray-100">
                <CardContent className="p-6 flex flex-col items-center gap-4 text-center relative">
                  <div className="relative w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center p-3 border shadow-inner">
                    {link.imageUrl ? <Image src={link.imageUrl} alt="Icon" fill className="object-contain p-2" unoptimized /> : <Grid size={24} className="text-primary" />}
                  </div>
                  <h4 className="font-black text-[10px] uppercase text-gray-900 truncate w-full">{link.label}</h4>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDoc(doc(db!, 'quick_links', link.id))}><Trash2 size={14}/></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feature_cards" className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-fit">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-base font-black uppercase">Add Action Card</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                <form onSubmit={handleAddAction} className="space-y-4">
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Heading</Label><Input value={actionFormData.title} onChange={e => setActionFormData({...actionFormData, title: e.target.value})} className="h-10 bg-gray-50 border-none font-bold" /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Redirection</Label><Input value={actionFormData.link} onChange={e => setActionFormData({...actionFormData, link: e.target.value})} className="h-10 bg-gray-50 border-none" /></div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase">Visual Style</Label>
                    <Select value={actionFormData.bgGradient} onValueChange={val => setActionFormData({...actionFormData, bgGradient: val})}>
                      <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRADIENTS.map(g => <SelectItem key={g.value} value={g.value} className="text-[10px] font-bold uppercase">{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isActionSubmitting} className="w-full font-black h-11 bg-primary text-white shadow-xl">{isActionSubmitting ? <Loader2 className="animate-spin"/> : "Create Card"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions?.map(action => (
              <Card key={action.id} className={cn("border-none shadow-xl bg-gradient-to-br text-white relative overflow-hidden h-28 rounded-3xl group", action.bgGradient)}>
                <CardContent className="p-6 h-full flex flex-col justify-center relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-tight">{action.title}</h3>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase">Link: {action.link}</p>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/40 hover:text-white hover:bg-white/10 h-8 w-8" onClick={() => deleteDoc(doc(db!, 'quick_actions', action.id))}><Trash2 size={16}/></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
