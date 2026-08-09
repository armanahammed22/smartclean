
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
import { useToast } from '@/hooks/use-toast';
import { 
  Palette, 
  Save, 
  Loader2, 
  Layout, 
  List, 
  Trash2, 
  Plus, 
  Zap, 
  Monitor, 
  Smartphone, 
  Eye, 
  X,
  Type,
  MousePointer2,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';

const DEFAULT_THEME = {
  header: {
    bgColor: '#ffffff',
    textColor: '#081621',
    hoverColor: '#2263C0',
    fontSize: 'text-sm',
    showTopBar: true,
    topBarBg: '#f9fafb',
    topBarText: '#6b7280',
    customRequestDesktopTitle: 'কাস্টম রিকোয়েস্ট',
    customRequestMobileTitle: 'রিকোয়েস্ট',
    customRequestIconUrl: 'https://picsum.photos/seed/clean-bucket/100/100',
    customRequestDesktopBg: '#1E5F7A',
    customRequestDesktopTextColor: '#ffffff',
    customRequestDesktopFontSize: 'text-[11px]',
    customRequestMobileBg: '#f1f5f9',
    customRequestMobileTextColor: '#1E5F7A',
    customRequestMobileFontSize: 'text-[10px]',
    menuItems: [
      { label: 'Home', link: '/' },
      { label: 'Services', link: '/services' },
      { label: 'Products', link: '/products' }
    ]
  },
  footer: {
    bgColor: '#050505',
    textColor: '#9ca3af',
    headingColor: '#ffffff',
    linkHoverColor: '#2263C0',
    showSocial: true,
    showDownload: true,
    serviceLinks: [
      { label: 'Residential Cleaning', link: '/services' },
      { label: 'Office Cleaning', link: '/services' },
      { label: 'Deep Cleaning', link: '/services' }
    ],
    companyLinks: [
      { label: 'About Us', link: '/page/about-us' },
      { label: 'Privacy Policy', link: '/page/privacy-policy' },
      { label: 'Terms of Service', link: '/page/terms-of-service' }
    ]
  }
};

export default function LayoutThemePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'layout') : null, [db]);
  const { data: themeData, isLoading } = useDoc(themeRef);

  const [formData, setFormData] = useState<any>(DEFAULT_THEME);

  useEffect(() => {
    if (!isLoading && themeData && !isInitialized) {
      setFormData({
        ...DEFAULT_THEME,
        ...themeData,
        header: { ...DEFAULT_THEME.header, ...(themeData.header || {}) },
        footer: { ...DEFAULT_THEME.footer, ...(themeData.footer || {}) }
      });
      setIsInitialized(true);
    }
  }, [themeData, isLoading, isInitialized]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'layout'), formData, { merge: true });
      toast({ title: "Theme Engine Updated", description: "All changes are now live across the site." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMenuItem = (section: 'header' | 'footer', listKey: string) => {
    const newItem = { label: 'New Link', link: '#' };
    const sectionData = { ...formData[section] };
    sectionData[listKey] = [...(sectionData[listKey] || []), newItem];
    setFormData({ ...formData, [section]: sectionData });
  };

  const updateItem = (section: 'header' | 'footer', listKey: string, idx: number, field: string, val: string) => {
    const list = [...formData[section][listKey]];
    list[idx][field] = val;
    setFormData({ ...formData, [section]: { ...formData[section], [listKey]: list } });
  };

  const removeItem = (section: 'header' | 'footer', listKey: string, idx: number) => {
    const list = formData[section][listKey].filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, [section]: { ...formData[section], [listKey]: list } });
  };

  if (isLoading && !isInitialized) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight uppercase">Global Styling Console</h1>
          <p className="text-muted-foreground text-sm font-medium">Control Header, Footer and global Navbar links</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Update Branding
        </Button>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="header" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-bold text-[10px]">
            <Layout size={16} /> Header & Navigation
          </TabsTrigger>
          <TabsTrigger value="footer" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-bold text-[10px]">
            <List size={16} /> Website Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3">Navbar Configuration</CardTitle>
                <CardDescription className="text-white/40 uppercase font-bold text-[9px]">Manage links and appearance</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Main Background</Label>
                    <Input type="color" value={formData.header.bgColor} onChange={e => setFormData({...formData, header: {...formData.header, bgColor: e.target.value}})} className="h-12 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Menu Text Color</Label>
                    <Input type="color" value={formData.header.textColor} onChange={e => setFormData({...formData, header: {...formData.header, textColor: e.target.value}})} className="h-12 p-1" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-xs font-black uppercase flex items-center gap-2 text-primary"><Navigation size={14} /> Desktop Menu Links</Label>
                    <Button type="button" size="sm" onClick={() => addMenuItem('header', 'menuItems')} className="rounded-xl h-8 text-[9px] font-black uppercase">+ Add Link</Button>
                  </div>
                  <div className="space-y-3">
                    {formData.header.menuItems?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[8px] font-bold text-gray-400 uppercase">Label</Label>
                          <Input value={item.label} onChange={e => updateItem('header', 'menuItems', i, 'label', e.target.value)} placeholder="Label" className="h-9 bg-white font-bold" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-[8px] font-bold text-gray-400 uppercase">Redirect URL</Label>
                          <Input value={item.link} onChange={e => updateItem('header', 'menuItems', i, 'link', e.target.value)} placeholder="/link" className="h-9 bg-white font-mono text-[10px]" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem('header', 'menuItems', i)} className="text-destructive group-hover:bg-red-50 mt-4"><Trash2 size={16} /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Zap className="text-primary" size={20} /> Custom Request Branding</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Desktop Title</Label>
                      <Input value={formData.header.customRequestDesktopTitle} onChange={e => setFormData({...formData, header: {...formData.header, customRequestDesktopTitle: e.target.value}})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mobile Title</Label>
                      <Input value={formData.header.customRequestMobileTitle} onChange={e => setFormData({...formData, header: {...formData.header, customRequestMobileTitle: e.target.value}})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                  </div>
                  <ImageUploader label="Custom Icon" initialUrl={formData.header.customRequestIconUrl} onUpload={url => setFormData({...formData, header: {...formData.header, customRequestIconUrl: url}})} aspectRatio="aspect-square w-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8 sticky top-24 border border-gray-100">
              <h3 className="font-black uppercase text-xs tracking-widest text-primary mb-6 flex items-center gap-2"><Eye size={16} /> Real-time Preview</h3>
              <div className="rounded-2xl border shadow-xl overflow-hidden" style={{ backgroundColor: formData.header.bgColor }}>
                <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <span className="font-black text-xs" style={{ color: formData.header.textColor }}>LOGO</span>
                  <div className="flex gap-4">
                    {formData.header.menuItems?.slice(0, 3).map((item: any, i: number) => (
                      <span key={i} className="text-[10px] font-bold uppercase" style={{ color: formData.header.textColor }}>{item.label}</span>
                    ))}
                  </div>
                </div>
                <div className="p-8 flex justify-center">
                   <div className="px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2" style={{ backgroundColor: formData.header.customRequestDesktopBg, color: formData.header.customRequestDesktopTextColor }}>
                     {formData.header.customRequestDesktopTitle}
                   </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="footer">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <CardTitle className="text-lg font-black uppercase">Footer Identity</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Footer Background</Label>
                      <Input type="color" value={formData.footer.bgColor} onChange={e => setFormData({...formData, footer: {...formData.footer, bgColor: e.target.value}})} className="h-12 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Body Text Color</Label>
                      <Input type="color" value={formData.footer.textColor} onChange={e => setFormData({...formData, footer: {...formData.footer, textColor: e.target.value}})} className="h-12 p-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
