
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
  Type, 
  MousePointer2, 
  Eye,
  Plus,
  Trash2,
  List,
  Facebook,
  Instagram,
  MessageCircle,
  Link as LinkIcon,
  Zap,
  ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';

const DEFAULT_THEME = {
  header: {
    bgColor: '#ffffff',
    textColor: '#081621',
    hoverColor: '#2263C0',
    fontSize: 'text-sm',
    showTopBar: true,
    topBarBg: '#f9fafb',
    topBarText: '#6b7280',
    customRequestTitle: 'কাস্টম রিকোয়েস্ট',
    customRequestIconUrl: '',
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

  const themeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'layout') : null, [db]);
  const { data: themeData, isLoading } = useDoc(themeRef);

  const [formData, setFormData] = useState<any>(DEFAULT_THEME);

  useEffect(() => {
    if (themeData) {
      setFormData({
        ...DEFAULT_THEME,
        ...themeData,
        header: { ...DEFAULT_THEME.header, ...(themeData.header || {}) },
        footer: { ...DEFAULT_THEME.footer, ...(themeData.footer || {}) }
      });
    }
  }, [themeData]);

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

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Layout & Theme Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Complete control over Header, Footer and global branding</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Publish Theme
        </Button>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="header" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layout size={16} /> Navigation Header
          </TabsTrigger>
          <TabsTrigger value="footer" className="rounded-lg gap-2 flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
            <List size={16} /> Website Footer
          </TabsTrigger>
        </TabsList>

        {/* HEADER EDITOR */}
        <TabsContent value="header" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3">Navigation Styles</CardTitle>
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
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hover Highlight</Label>
                    <Input type="color" value={formData.header.hoverColor} onChange={e => setFormData({...formData, header: {...formData.header, hoverColor: e.target.value}})} className="h-12 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Font Scale</Label>
                    <select className="w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-bold border-none" value={formData.header.fontSize} onChange={e => setFormData({...formData, header: {...formData.header, fontSize: e.target.value}})}>
                      <option value="text-[10px]">Tiny</option>
                      <option value="text-xs">Small</option>
                      <option value="text-sm">Standard</option>
                      <option value="text-base">Large</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase">Utility Top-Bar</Label>
                    <p className="text-[9px] text-muted-foreground">SHOW LOGIN/LANGUAGE BAR ON DESKTOP</p>
                  </div>
                  <Switch checked={formData.header.showTopBar} onCheckedChange={val => setFormData({...formData, header: {...formData.header, showTopBar: val}})} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Zap className="text-primary" size={20} /> Custom Request Branding</CardTitle>
                <CardDescription>Customize the 'Custom Request' button identity in the header.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Button Title</Label>
                      <Input 
                        value={formData.header.customRequestTitle} 
                        onChange={e => setFormData({...formData, header: {...formData.header, customRequestTitle: e.target.value}})}
                        placeholder="e.g. কাস্টম রিকোয়েস্ট"
                        className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                      />
                      <p className="text-[9px] text-muted-foreground italic">Leave empty to show only the icon.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <ImageUploader 
                      label="Custom Icon Image"
                      hint="100 x 100 px (PNG recommended)"
                      initialUrl={formData.header.customRequestIconUrl}
                      aspectRatio="aspect-square w-24"
                      onUpload={(url) => setFormData({...formData, header: {...formData.header, customRequestIconUrl: url}})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold">Navigation Links</CardTitle>
                  <Button size="sm" onClick={() => addMenuItem('header', 'menuItems')} className="rounded-xl h-8 text-[10px] uppercase font-black">+ Add Link</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {formData.header.menuItems?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                    <Input value={item.label} onChange={e => updateItem('header', 'menuItems', i, 'label', e.target.value)} placeholder="Label" className="flex-1 bg-white" />
                    <Input value={item.link} onChange={e => updateItem('header', 'menuItems', i, 'link', e.target.value)} placeholder="/link" className="flex-1 bg-white font-mono text-[10px]" />
                    <Button variant="ghost" size="icon" onClick={() => removeItem('header', 'menuItems', i)} className="text-destructive group-hover:bg-red-50"><Trash2 size={16} /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8 sticky top-24">
              <h3 className="font-black uppercase text-xs tracking-widest text-primary mb-6 flex items-center gap-2"><Eye size={16} /> Live Preview</h3>
              <div 
                className="rounded-2xl border-2 shadow-inner overflow-hidden transition-all duration-500" 
                style={{ backgroundColor: formData.header.bgColor }}
              >
                <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <div className="font-black text-xs" style={{ color: formData.header.textColor }}>LOGO</div>
                  <div className="flex gap-4">
                    {formData.header.menuItems?.slice(0, 3).map((item: any, i: number) => (
                      <span key={i} className={cn(formData.header.fontSize, "font-bold")} style={{ color: formData.header.textColor }}>{item.label}</span>
                    ))}
                  </div>
                </div>
                <div className="p-10 text-center text-gray-300 italic text-xs">Navigation Content Area</div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* FOOTER EDITOR */}
        <TabsContent value="footer" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3">Footer Identity</CardTitle>
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
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Heading Text Color</Label>
                    <Input type="color" value={formData.footer.headingColor} onChange={e => setFormData({...formData, footer: {...formData.footer, headingColor: e.target.value}})} className="h-12 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Link Hover Color</Label>
                    <Input type="color" value={formData.footer.linkHoverColor} onChange={e => setFormData({...formData, footer: {...formData.footer, linkHoverColor: e.target.value}})} className="h-12 p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <Label className="text-[10px] font-black uppercase">Show Social Icons</Label>
                    <Switch checked={formData.footer.showSocial} onCheckedChange={val => setFormData({...formData, footer: {...formData.footer, showSocial: val}})} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <Label className="text-[10px] font-black uppercase">App Downloads</Label>
                    <Switch checked={formData.footer.showDownload} onCheckedChange={val => setFormData({...formData, footer: {...formData.footer, showDownload: val}})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50 p-6 border-b flex flex-row items-center justify-between">
                  <Label className="font-black uppercase text-xs">Service Column</Label>
                  <Button size="icon" variant="ghost" onClick={() => addMenuItem('footer', 'serviceLinks')} className="h-8 w-8"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.footer.serviceLinks?.map((item: any, i: number) => (
                    <div key={i} className="space-y-1 bg-gray-50 p-2 rounded-lg relative group">
                      <Input value={item.label} onChange={e => updateItem('footer', 'serviceLinks', i, 'label', e.target.value)} className="h-7 text-[10px] font-bold border-none" />
                      <Input value={item.link} onChange={e => updateItem('footer', 'serviceLinks', i, 'link', e.target.value)} className="h-7 text-[8px] font-mono border-none" />
                      <button onClick={() => removeItem('footer', 'serviceLinks', i)} className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100"><X size={12}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50 p-6 border-b flex flex-row items-center justify-between">
                  <Label className="font-black uppercase text-xs">Company Column</Label>
                  <Button size="icon" variant="ghost" onClick={() => addMenuItem('footer', 'companyLinks')} className="h-8 w-8"><Plus size={14}/></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.footer.companyLinks?.map((item: any, i: number) => (
                    <div key={i} className="space-y-1 bg-gray-50 p-2 rounded-lg relative group">
                      <Input value={item.label} onChange={e => updateItem('footer', 'companyLinks', i, 'label', e.target.value)} className="h-7 text-[10px] font-bold border-none" />
                      <Input value={item.link} onChange={e => updateItem('footer', 'companyLinks', i, 'link', e.target.value)} className="h-7 text-[8px] font-mono border-none" />
                      <button onClick={() => removeItem('footer', 'companyLinks', i)} className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100"><X size={12}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8 sticky top-24">
              <h3 className="font-black uppercase text-xs tracking-widest text-primary mb-6">Preview State</h3>
              <div 
                className="rounded-2xl shadow-xl overflow-hidden" 
                style={{ backgroundColor: formData.footer.bgColor, color: formData.footer.textColor }}
              >
                <div className="p-8 grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="font-black text-xs uppercase" style={{ color: formData.footer.headingColor }}>Services</div>
                    <div className="space-y-2 opacity-60 text-[9px] font-bold">
                      {formData.footer.serviceLinks?.slice(0, 3).map((l: any, i: number) => <div key={i}>{l.label}</div>)}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="font-black text-xs uppercase" style={{ color: formData.footer.headingColor }}>Social</div>
                    <div className="flex gap-3">
                      <Facebook size={14} />
                      <Instagram size={14} />
                      <MessageCircle size={14} />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/20 text-center text-[8px] opacity-40">All Rights Reserved Preview</div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
