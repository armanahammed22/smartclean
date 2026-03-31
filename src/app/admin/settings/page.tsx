'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Mail, 
  Save, 
  Search, 
  Loader2,
  Link as LinkIcon,
  ShieldCheck,
  Layout,
  Smartphone,
  Box,
  Wrench,
  GripVertical,
  ArrowUp,
  ArrowDown,
  List,
  Download,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const DEFAULT_MENU_KEYS = [
  'dashboard', 
  'finance',
  'sales', 
  'ai_agents', 
  'orders', 
  'vendor_hub',
  'partners',
  'inventory', 
  'services', 
  'marketing', 
  'seo_hub',
  'customize', 
  'system'
];

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const layoutConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(layoutConfigRef);

  const [formData, setFormData] = useState<any>({
    websiteName: 'Smart Clean',
    logoUrl: '',
    logoLink: '/',
    faviconUrl: '',
    appIconUrl: '',
    contactEmail: 'smartclean422@gmail.com',
    contactPhone: '+8801919640422',
    address: 'Wireless Gate, Mohakhali, Dhaka-1212',
    socialLinks: { facebook: '', instagram: '', linkedin: '', whatsapp: '' },
    currency: 'BDT',
    defaultLanguage: 'bn',
    seoTitle: 'Smart Clean | Professional Cleaning in Bangladesh',
    seoDescription: 'Expert cleaning and maintenance services for your home and office.',
    footerContent: '© 2026 Smart Clean Bangladesh. All rights reserved.',
    otpEnabled: false,
    productsEnabled: true,
    servicesEnabled: true,
    playStoreLink: '',
    apkDownloadLink: ''
  });

  const [menuOrder, setMenuOrder] = useState<string[]>(DEFAULT_MENU_KEYS);
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings,
        socialLinks: { ...formData.socialLinks, ...(settings.socialLinks || {}) },
        productsEnabled: settings.productsEnabled ?? true,
        servicesEnabled: settings.servicesEnabled ?? true
      });
    }
  }, [settings]);

  useEffect(() => {
    if (sidebarConfig) {
      if (sidebarConfig.order) {
        const saved = sidebarConfig.order as string[];
        const missing = DEFAULT_MENU_KEYS.filter(k => !saved.includes(k));
        setMenuOrder([...saved, ...missing]);
      }
      if (sidebarConfig.visibility) {
        setMenuVisibility(sidebarConfig.visibility);
      }
    }
  }, [sidebarConfig]);

  const handleSave = () => {
    if (!db || !user) return;
    setIsSubmitting(true);
    const { id, ...dataToSave } = formData;
    const docRef = doc(db, 'site_settings', 'global');
    
    setDoc(docRef, {
      ...dataToSave,
      updatedAt: new Date().toISOString()
    }, { merge: true })
      .then(() => {
        toast({ title: "Settings Saved" });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: dataToSave
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...menuOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setMenuOrder(newOrder);
  };

  const toggleVisibility = (key: string) => {
    setMenuVisibility(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };

  const handleSaveSidebarLayout = async () => {
    if (!db || !user) return;
    setIsSavingLayout(true);
    try {
      await setDoc(doc(db, 'site_settings', 'admin_sidebar'), {
        order: menuOrder,
        visibility: menuVisibility,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Sidebar Layout Saved", description: "All menu visibility and order changes are now live." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingLayout(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading Settings...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Global Command Center</h1>
          <p className="text-muted-foreground text-sm">Synchronize core modules and feature availability system-wide</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-lg text-primary-foreground bg-primary">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Publish Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Globe size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="visibility" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bell size={16} /> Feature Logic
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <List size={16} /> Navigation
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail size={16} /> Channels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sidebar">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <List className="text-primary" size={20} /> Sidebar Management
                  </CardTitle>
                  <CardDescription className="text-white/40 uppercase font-bold text-[9px]">Toggle Visibility and Order of Menu Groups</CardDescription>
                </div>
                <Button onClick={handleSaveSidebarLayout} disabled={isSavingLayout} className="rounded-xl font-black bg-primary px-8 h-11 shadow-lg">
                  {isSavingLayout ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} className="mr-2" /> Sync Sidebar</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-3 max-w-2xl mx-auto">
                {menuOrder.map((key, index) => {
                  const isHidden = menuVisibility[key] === false;
                  return (
                    <div key={key} className={cn(
                      "flex items-center justify-between p-4 bg-white rounded-2xl border transition-all group",
                      isHidden ? "opacity-50 border-gray-100 bg-gray-50/50" : "border-gray-100 hover:border-primary/30 hover:shadow-md"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-50 rounded-lg text-primary opacity-40"><GripVertical size={16} /></div>
                        <div>
                          <span className="font-black uppercase text-xs tracking-widest text-gray-700">{key.replace(/_/g, ' ')}</span>
                          {isHidden && <span className="ml-2 text-[8px] font-black text-red-500 uppercase tracking-tighter">(Hidden)</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 border-r pr-3 border-gray-100">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMenu(index, 'up')} disabled={index === 0}><ArrowUp size={16} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMenu(index, 'down')} disabled={index === menuOrder.length - 1}><ArrowDown size={16} /></Button>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                          <Label className="text-[8px] font-black uppercase text-muted-foreground">{isHidden ? 'OFF' : 'ON'}</Label>
                          <Switch 
                            checked={!isHidden} 
                            onCheckedChange={() => toggleVisibility(key)}
                            className="scale-75"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Website Name</Label>
                    <Input value={formData.websiteName} onChange={(e) => setFormData({...formData, websiteName: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ImageUploader label="Master Logo" hint="512 x 512 px" initialUrl={formData.logoUrl} onUpload={(url) => setFormData({...formData, logoUrl: url})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Feature Synchronization</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-rose-600 shadow-sm"><Box size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-rose-900 uppercase">Product E-commerce</Label>
                    </div>
                  </div>
                  <Switch checked={formData.productsEnabled} onCheckedChange={(val) => setFormData({...formData, productsEnabled: val})} />
                </div>
                <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><Wrench size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-indigo-900 uppercase">Service Booking</Label>
                    </div>
                  </div>
                  <Switch checked={formData.servicesEnabled} onCheckedChange={(val) => setFormData({...formData, servicesEnabled: val})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
