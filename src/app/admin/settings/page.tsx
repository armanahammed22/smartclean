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
  Bell
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
  'offers', 
  'crm', 
  'reports', 
  'customize', 
  'system', 
  'support'
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
    if (sidebarConfig?.order) {
      const saved = sidebarConfig.order as string[];
      const missing = DEFAULT_MENU_KEYS.filter(k => !saved.includes(k));
      setMenuOrder([...saved, ...missing]);
    }
  }, [sidebarConfig]);

  const handleSave = () => {
    if (!db) return;
    
    if (!user) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Required", 
        description: "Your session has expired. Please re-login to save settings." 
      });
      return;
    }

    setIsSubmitting(true);
    
    // Clean data before save
    const { id, ...dataToSave } = formData;
    const docRef = doc(db, 'site_settings', 'global');
    
    setDoc(docRef, {
      ...dataToSave,
      updatedAt: new Date().toISOString()
    }, { merge: true })
      .then(() => {
        toast({ title: "Settings Saved", description: "Global configuration updated successfully. All modules synchronized." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: dataToSave
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...menuOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setMenuOrder(newOrder);
  };

  const handleSaveSidebarLayout = async () => {
    if (!db || !user) return;
    setIsSavingLayout(true);
    try {
      await setDoc(doc(db, 'site_settings', 'admin_sidebar'), {
        order: menuOrder,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Sidebar Layout Updated", description: "Menu position changes are now live." });
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
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck size={16} /> Guard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
              <CardDescription>Website name, logo, and core preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Website Name</Label>
                    <Input 
                      value={formData.websiteName} 
                      onChange={(e) => setFormData({...formData, websiteName: e.target.value})}
                      className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Base Redirection</Label>
                    <Input 
                      value={formData.logoLink} 
                      onChange={(e) => setFormData({...formData, logoLink: e.target.value})}
                      className="h-12 bg-gray-50 border-none rounded-xl"
                      placeholder="/"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ImageUploader 
                    label="Master Logo"
                    hint="512 x 512 px (PNG)"
                    initialUrl={formData.logoUrl}
                    aspectRatio="aspect-square w-24"
                    onUpload={(url) => setFormData({...formData, logoUrl: url})}
                  />
                  <ImageUploader 
                    label="Favicon"
                    hint="32 x 32 px"
                    initialUrl={formData.faviconUrl}
                    aspectRatio="aspect-square w-16"
                    onUpload={(url) => setFormData({...formData, faviconUrl: url})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Feature Synchronization Protocol</CardTitle>
              <CardDescription>Disable modules system-wide. This reflects instantly on Frontend and Dashboards.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-rose-600 shadow-sm"><Box size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-rose-900 uppercase">Product E-commerce</Label>
                      <p className="text-[10px] text-rose-700/70 font-bold uppercase leading-tight">Physical Items, Orders, Inventory</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.productsEnabled} 
                    onCheckedChange={(val) => setFormData({...formData, productsEnabled: val})} 
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><Wrench size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-indigo-900 uppercase">Service Booking</Label>
                      <p className="text-[10px] text-indigo-700/70 font-bold uppercase leading-tight">Appointments, Teams, Scheduling</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.servicesEnabled} 
                    onCheckedChange={(val) => setFormData({...formData, servicesEnabled: val})} 
                  />
                </div>
              </div>
              
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm shrink-0"><Bell size={20} /></div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-amber-900">System Impact Notification</h4>
                  <p className="text-[11px] text-amber-800/70 leading-relaxed font-medium uppercase">
                    Disabling a module hides it from the homepage, search, and all management hubs. Customers will not be able to checkout items belonging to disabled modules.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebar">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <List className="text-primary" size={20} /> Global Admin Navigation
                </CardTitle>
                <Button onClick={handleSaveSidebarLayout} disabled={isSavingLayout} className="rounded-xl font-black bg-primary">
                  {isSavingLayout ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-2 max-w-2xl mx-auto">
                {menuOrder.map((key, index) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg border text-primary opacity-40"><GripVertical size={16} /></div>
                      <span className="font-black uppercase text-xs tracking-widest text-gray-700">{key.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMenu(index, 'up')} disabled={index === 0}><ArrowUp size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMenu(index, 'down')} disabled={index === menuOrder.length - 1}><ArrowDown size={16} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
