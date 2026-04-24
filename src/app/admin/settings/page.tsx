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
  Loader2,
  Layout,
  Smartphone,
  Box,
  Wrench,
  GripVertical,
  ArrowUp,
  ArrowDown,
  List,
  Bell,
  Eye,
  ShieldCheck,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Download,
  Info,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  FileSignature,
  FileText,
  Printer,
  Zap,
  CheckSquare
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const DEFAULT_MENU_KEYS = [
  'dashboard_link', 
  'sales', 
  'orders', 
  'inventory',
  'services', 
  'marketing', 
  'offers',
  'seo',
  'hrm',
  'customer_hub',
  'partners',
  'vendors',
  'finance',
  'reports',
  'customize', 
  'system',
  'ai_agents',
  'support'
];

const MENU_LABELS: Record<string, string> = {
  dashboard_link: "Dashboard",
  sales: "Sales Terminal",
  orders: "Order & Booking",
  inventory: "PRODUCT MENU",
  services: "SERVICE MENU",
  marketing: "MARKETING & PROMOTIONS",
  offers: "OFFER & CAMPAIGN",
  seo: "SEO & TRACKING",
  hrm: "HRM",
  customer_hub: "Customer Hub",
  partners: "B2B PARTNERS",
  vendors: "VENDOR HUB",
  finance: "FINANCIAL HUB",
  reports: "BUSINESS REPORT",
  customize: "SITE CUSTOMIZE",
  system: "SETTINGS",
  ai_agents: "AI AGENTS (STAFF)",
  support: "SUPPORT"
};

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const layoutConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(layoutConfigRef);

  const [formData, setFormData] = useState<any>({
    websiteName: 'Smart Clean',
    logoUrl: '',
    signatureUrl: '',
    logoLink: '/',
    faviconUrl: '',
    appIconUrl: '',
    contactEmail: 'smartclean422@gmail.com',
    contactPhone: '+8801919640422',
    address: 'GP.JA-66/2, Wireless Gate, Mohakhali, Dhaka-1212',
    socialLinks: { facebook: '', instagram: '', linkedin: '', whatsapp: '' },
    currency: 'BDT',
    defaultLanguage: 'bn',
    seoTitle: 'Smart Clean | Professional Cleaning in Bangladesh',
    seoDescription: 'Expert cleaning and maintenance services for your home and office.',
    footerContent: '© 2026 Smart Clean Bangladesh. All rights reserved.',
    otpEnabled: false,
    productsEnabled: true,
    servicesEnabled: true,
    invoiceHeaderPhone: '+8801919640422',
    invoiceHeaderEmail: 'billing@smartclean.com.bd',
    invoiceHeaderAddress: 'Mohakhali, Dhaka, Bangladesh',
    invoiceFooterNote: 'Payment should be cleared at site upon completion. For any billing query, call +8801919640422.',
    invoiceFooterDisclaimer: 'This is a computer generated document and does not require a physical stamp for internal processing.',
    invoiceProvidedServices: 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control'
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
    if (sidebarConfig && !isInitialized) {
      if (sidebarConfig.order) {
        const saved = sidebarConfig.order as string[];
        const missing = DEFAULT_MENU_KEYS.filter(k => !saved.includes(k));
        setMenuOrder([...saved, ...missing]);
      }
      if (sidebarConfig.visibility) {
        setMenuVisibility(sidebarConfig.visibility);
      }
      setIsInitialized(true);
    }
  }, [sidebarConfig, isInitialized]);

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
    const nextVal = menuVisibility[key] === false ? true : false;
    setMenuVisibility(prev => ({ ...prev, [key]: nextVal }));
  };

  const handleSyncSidebar = async () => {
    if (!db || !user) return;
    setIsSavingLayout(true);
    try {
      const fullVisibility: Record<string, boolean> = {};
      DEFAULT_MENU_KEYS.forEach(key => {
        fullVisibility[key] = true;
      });

      setMenuOrder(DEFAULT_MENU_KEYS);
      setMenuVisibility(fullVisibility);

      await setDoc(doc(db, 'site_settings', 'admin_sidebar'), {
        order: DEFAULT_MENU_KEYS,
        visibility: fullVisibility,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Sidebar Synced", description: "Default system order restored and applied." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleSaveCustomLayout = async () => {
    if (!db || !user) return;
    setIsSavingLayout(true);
    try {
      await setDoc(doc(db, 'site_settings', 'admin_sidebar'), {
        order: menuOrder,
        visibility: menuVisibility,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Layout Published", description: "Custom sidebar order is now active." });
    } catch (e) {
      toast({ variant: "destructive", title: "Publication Failed" });
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
          <p className="text-muted-foreground text-sm font-medium">Synchronize core modules and feature availability system-wide</p>
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
          <TabsTrigger value="invoice" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Printer size={16} /> Invoice Config
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <List size={16} /> Navigation
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail size={16} /> Channels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Website Name</Label>
                      <Input value={formData.websiteName} onChange={(e) => setFormData({...formData, websiteName: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>

                    <div className="space-y-6 pt-6 border-t">
                      <div className="flex items-center gap-3 mb-2">
                        <FileSignature className="text-primary" size={20} />
                        <Label className="text-xs font-black uppercase text-gray-900 tracking-widest">Digital Authentication</Label>
                      </div>
                      <ImageUploader 
                        label="Official Signature" 
                        hint="200 x 100 px (Transparent PNG Recommended)" 
                        initialUrl={formData.signatureUrl} 
                        onUpload={(url) => setFormData({...formData, signatureUrl: url})} 
                        aspectRatio="aspect-[2/1] w-48"
                      />
                      <p className="text-[10px] text-muted-foreground italic leading-relaxed">This signature will appear on all generated invoices and quotations.</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <ImageUploader label="Master Branding Logo" hint="512 x 512 px" initialUrl={formData.logoUrl} onUpload={(url) => setFormData({...formData, logoUrl: url})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">App Assets</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUploader label="Favicon" hint="32 x 32 px" initialUrl={formData.faviconUrl} onUpload={(url) => setFormData({...formData, faviconUrl: url})} aspectRatio="aspect-square w-24" />
                  <ImageUploader label="App Touch Icon" hint="180 x 180 px" initialUrl={formData.appIconUrl} onUpload={(url) => setFormData({...formData, appIconUrl: url})} aspectRatio="aspect-square w-24" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Footer Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Footer Copyright Text</Label>
                  <Input value={formData.footerContent} onChange={(e) => setFormData({...formData, footerContent: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Logo Redirect Link</Label>
                  <Input value={formData.logoLink} onChange={(e) => setFormData({...formData, logoLink: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visibility">
          <div className="space-y-6">
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
                        <p className="text-[9px] text-muted-foreground font-bold">TOGGLE PRODUCT MARKETPLACE</p>
                      </div>
                    </div>
                    <Switch checked={formData.productsEnabled} onCheckedChange={(val) => setFormData({...formData, productsEnabled: val})} />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><Wrench size={24} /></div>
                      <div className="space-y-1">
                        <Label className="text-sm font-black text-indigo-900 uppercase">Service Booking</Label>
                        <p className="text-[9px] text-muted-foreground font-bold">TOGGLE SERVICE ENGINE</p>
                      </div>
                    </div>
                    <Switch checked={formData.servicesEnabled} onCheckedChange={(val) => setFormData({...formData, servicesEnabled: val})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Authentication Logic</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 max-w-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Smartphone size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-blue-900 uppercase">Phone OTP Login</Label>
                      <p className="text-[9px] text-muted-foreground font-bold">REQUIRE SMS VERIFICATION</p>
                    </div>
                  </div>
                  <Switch checked={formData.otpEnabled} onCheckedChange={(val) => setFormData({...formData, otpEnabled: val})} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoice">
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                  <FileText size={20} className="text-primary" /> Invoice & PDF Customization
                </CardTitle>
                <CardDescription className="text-white/40 uppercase font-bold text-[9px]">Edit header, footer and professional notes</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center gap-2"><Layout size={14}/> Header Overrides</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Header Phone</Label>
                        <Input value={formData.invoiceHeaderPhone} onChange={e => setFormData({...formData, invoiceHeaderPhone: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Header Email</Label>
                        <Input value={formData.invoiceHeaderEmail} onChange={e => setFormData({...formData, invoiceHeaderEmail: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Header Address</Label>
                        <Input value={formData.invoiceHeaderAddress} onChange={e => setFormData({...formData, invoiceHeaderAddress: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center gap-2"><Zap size={14}/> Legal & Notes</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Terms & Conditions Note</Label>
                        <Textarea value={formData.invoiceFooterNote} onChange={e => setFormData({...formData, invoiceFooterNote: e.target.value})} className="h-24 bg-gray-50 border-none rounded-xl text-xs leading-relaxed" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">System Disclaimer (Small)</Label>
                        <Textarea value={formData.invoiceFooterDisclaimer} onChange={e => setFormData({...formData, invoiceFooterDisclaimer: e.target.value})} className="h-20 bg-gray-50 border-none rounded-xl text-[10px] leading-relaxed" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 📋 NEW: SERVICES WE PROVIDE LIST */}
                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b pb-2 flex items-center gap-2"><CheckSquare size={14}/> Services We Provide (Footer List)</h4>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">List of Services (Comma Separated)</Label>
                    <Textarea 
                      value={formData.invoiceProvidedServices} 
                      onChange={e => setFormData({...formData, invoiceProvidedServices: e.target.value})} 
                      placeholder="Home Cleaning, Deep Cleaning, Office Cleaning..."
                      className="h-24 bg-gray-50 border-none rounded-xl text-sm font-medium leading-relaxed" 
                    />
                    <p className="text-[9px] text-muted-foreground italic">These services will appear in the invoice footer grid. Use commas to separate items.</p>
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={24} /></div>
                  <div className="space-y-1">
                    <h4 className="font-black uppercase text-xs text-blue-900">PDF Optimization Active</h4>
                    <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                      The invoice layout is specifically tuned for A4 dimensions. Your custom text will automatically wrap or truncate to maintain a professional look.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sidebar">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <List className="text-primary" size={20} /> Navigation Management
                  </CardTitle>
                  <CardDescription className="text-white/40 uppercase font-bold text-[9px]">Toggle Visibility and Order of Menu Groups</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button onClick={handleSyncSidebar} disabled={isSavingLayout} variant="outline" className="flex-1 sm:flex-none rounded-xl font-black bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 h-11 gap-2">
                    {isSavingLayout ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Sync Sidebar
                  </Button>
                  <Button onClick={handleSaveCustomLayout} disabled={isSavingLayout} className="flex-1 sm:flex-none rounded-xl font-black bg-primary px-8 h-11 shadow-lg gap-2">
                    {isSavingLayout ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Public Change
                  </Button>
                </div>
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
                        <div className="text-[10px] font-black text-primary/40 w-4">{index + 1}</div>
                        <div className="p-2 bg-gray-50 rounded-lg text-primary opacity-40 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
                        <span className="font-black uppercase text-xs tracking-widest text-gray-700">
                          {MENU_LABELS[key] || key.replace(/_/g, ' ')}
                        </span>
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

        <TabsContent value="contact">
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Contact Registry</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Official Phone</Label>
                    <Input value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Official Email</Label>
                    <Input value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Business Address</Label>
                  <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-gray-50 border-none rounded-xl min-h-[100px]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Social Presence</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Facebook size={12} className="text-blue-600"/> Facebook URL</Label>
                    <Input value={formData.socialLinks.facebook} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})} className="h-11 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Instagram size={12} className="text-pink-600"/> Instagram URL</Label>
                    <Input value={formData.socialLinks.instagram} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} className="h-11 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Linkedin size={12} className="text-blue-700"/> LinkedIn URL</Label>
                    <Input value={formData.socialLinks.linkedin} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, linkedin: e.target.value}})} className="h-11 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><MessageCircle size={12} className="text-green-600"/> WhatsApp Number</Label>
                    <Input value={formData.socialLinks.whatsapp} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, whatsapp: e.target.value}})} placeholder="+880..." className="h-11 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">App Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2"><LinkIcon size={12}/> Play Store Link</Label>
                  <Input value={formData.playStoreLink} onChange={(e) => setFormData({...formData, playStoreLink: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Download size={12}/> APK Download Link</Label>
                  <Input value={formData.apkDownloadLink} onChange={(e) => setFormData({...formData, apkDownloadLink: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
