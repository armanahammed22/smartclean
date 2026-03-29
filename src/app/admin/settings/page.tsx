
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, orderBy } from 'firebase/firestore';
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
  Download
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

// Default keys for reference
const DEFAULT_MENU_KEYS = [
  'dashboard', 'sales', 'ai_agents', 'orders', 'inventory', 
  'services', 'marketing', 'offers', 'crm', 'vendor_hub', 
  'reports', 'customize', 'system', 'support'
];

export default function AdminSettingsPage() {
  const db = useFirestore();
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
    seoDescription: 'Expert cleaning services for home and office.',
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
      // Merge with default keys to ensure new menus are not lost
      const saved = sidebarConfig.order as string[];
      const missing = DEFAULT_MENU_KEYS.filter(k => !saved.includes(k));
      setMenuOrder([...saved, ...missing]);
    }
  }, [sidebarConfig]);

  const handleSave = () => {
    if (!db) return;
    setIsSubmitting(true);
    const docRef = doc(db, 'site_settings', 'global');
    setDoc(docRef, formData, { merge: true })
      .then(() => {
        toast({ title: "Settings Saved", description: "Global configuration updated successfully." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: formData
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
    if (!db) return;
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
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Global Settings</h1>
          <p className="text-muted-foreground text-sm">Configure website core details and security</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 px-8 rounded-xl shadow-lg text-primary-foreground bg-primary">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Globe size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="visibility" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Feature Visibility
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <List size={16} /> Sidebar Layout
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail size={16} /> Contact & Social
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck size={16} /> Security
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Search size={16} /> SEO & Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
              <CardDescription>Website name, logo, and core preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Website Name</Label>
                    <Input 
                      value={formData.websiteName} 
                      onChange={(e) => setFormData({...formData, websiteName: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Logo Redirection Link</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.logoLink} 
                        onChange={(e) => setFormData({...formData, logoLink: e.target.value})}
                        className="h-11 pl-10"
                        placeholder="/"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Currency Symbol</Label>
                    <Input 
                      value={formData.currency} 
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ImageUploader 
                    label="Main Site Logo"
                    hint="512 x 512 px (PNG)"
                    initialUrl={formData.logoUrl}
                    aspectRatio="aspect-square w-24"
                    onUpload={(url) => setFormData({...formData, logoUrl: url})}
                  />
                  <ImageUploader 
                    label="Favicon"
                    hint="32 x 32 px (.ico/png)"
                    initialUrl={formData.faviconUrl}
                    aspectRatio="aspect-square w-16"
                    onUpload={(url) => setFormData({...formData, faviconUrl: url})}
                  />
                </div>
              </div>

              <div className="pt-8 border-t space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Smartphone size={20} className="text-primary" /> App Download Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Play Store Link</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.playStoreLink} 
                        onChange={(e) => setFormData({...formData, playStoreLink: e.target.value})}
                        placeholder="https://play.google.com/store/apps/details?id=..."
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">APK Direct Download Link</Label>
                    <div className="relative">
                      <Download className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.apkDownloadLink} 
                        onChange={(e) => setFormData({...formData, apkDownloadLink: e.target.value})}
                        placeholder="https://yourdomain.com/app.apk"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Feature Visibility Control</CardTitle>
              <CardDescription>Enable or disable core modules globally across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-red-50/50 rounded-2xl border border-red-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-red-600 shadow-sm"><Box size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-red-900 uppercase">Product Features</Label>
                      <p className="text-[10px] text-red-700/70 font-bold uppercase leading-tight">E-commerce, Orders, Inventory</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.productsEnabled} 
                    onCheckedChange={(val) => setFormData({...formData, productsEnabled: val})} 
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Wrench size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-blue-900 uppercase">Service Features</Label>
                      <p className="text-[10px] text-blue-700/70 font-bold uppercase leading-tight">Bookings, Technicians, Schedule</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.servicesEnabled} 
                    onCheckedChange={(val) => setFormData({...formData, servicesEnabled: val})} 
                  />
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <Layout className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                  Disabling a feature will hide it from the homepage, dashboard, and sidebar. Existing data remains safe in the database.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebar">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <List className="text-primary" size={20} /> Sidebar Menu Position
                  </CardTitle>
                  <CardDescription className="text-white/40 mt-1">Reorder main menu groups by moving them up or down.</CardDescription>
                </div>
                <Button onClick={handleSaveSidebarLayout} disabled={isSavingLayout} className="rounded-xl font-black bg-primary">
                  {isSavingLayout ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                  Save Layout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-2 max-w-2xl mx-auto">
                {menuOrder.map((key, index) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg border shadow-sm text-primary opacity-40">
                        <GripVertical size={16} />
                      </div>
                      <span className="font-black uppercase text-xs tracking-widest text-gray-700">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-20"
                        onClick={() => moveMenu(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-20"
                        onClick={() => moveMenu(index, 'down')}
                        disabled={index === menuOrder.length - 1}
                      >
                        <ArrowDown size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Security & Authentication</CardTitle>
              <CardDescription>Manage global security protocols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="space-y-1">
                  <Label className="text-sm font-black text-blue-900 uppercase">OTP Verification System</Label>
                  <p className="text-xs text-blue-700/70 font-medium">When enabled, users must verify their phone number via SMS OTP during login, signup, and booking.</p>
                </div>
                <Switch 
                  checked={formData.otpEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, otpEnabled: val})} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Business Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input 
                    value={formData.contactPhone} 
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input 
                    value={formData.contactEmail} 
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Physical Address</Label>
                  <Textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <Label className="text-sm font-bold block mb-4 uppercase tracking-wider text-muted-foreground">Social Media Profiles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['facebook', 'instagram', 'linkedin', 'whatsapp'].map((social) => (
                    <div key={social} className="space-y-2">
                      <Label className="capitalize">{social}</Label>
                      <Input 
                        placeholder={`https://${social}.com/yourpage`}
                        value={formData.socialLinks[social] || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          socialLinks: { ...formData.socialLinks, [social]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">SEO & Footer Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>SEO Title Tag</Label>
                <Input 
                  value={formData.seoTitle} 
                  onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={formData.seoDescription} 
                  onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Bottom Content (Copyright)</Label>
                <Input 
                  value={formData.footerContent} 
                  onChange={(e) => setFormData({...formData, footerContent: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
