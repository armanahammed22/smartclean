'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, 
  Save, 
  Loader2, 
  Layout, 
  Type, 
  Maximize, 
  MousePointer2, 
  FileText, 
  Zap, 
  RotateCcw, 
  Eye,
  Settings2,
  Table as TableIcon,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const DEFAULT_DESIGN = {
  primaryColor: '#1E5F7A',
  headerPaddingTop: 10,
  headerPaddingBottom: 10,
  sectionSpacing: 16,
  tableFontSize: 11,
  tableRowPadding: 6,
  headerFontSize: 24,
  bodyFontSize: 12,
  logoSize: 56,
  showGridLines: true,
  footerMarginTop: 20,
  signatureSpacing: 40,
  taglineFontSize: 12,
  disclaimerFontSize: 8,
  customTopText: '',
  customBottomText: '',
  isCompactMode: false
};

export default function DocumentDesignerPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const designRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'document_design') : null, [db]);
  const { data: currentDesign, isLoading } = useDoc(designRef);

  const [formData, setFormData] = useState<any>(DEFAULT_DESIGN);

  useEffect(() => {
    setMounted(true);
    if (currentDesign) {
      setFormData({ ...DEFAULT_DESIGN, ...currentDesign });
    }
  }, [currentDesign]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'document_design'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Design Protocol Published", description: "All PDF documents updated globally." });
    } catch (e) {
      toast({ variant: "destructive", title: "Publication Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  if (isLoading || !mounted) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={48} /><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Booting Designer...</p></div>;

  return (
    <div className="space-y-8 pb-32 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Visual Document Designer</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Layout className="text-primary" size={16}/> Professional A4 PDF Typography & Spacing Engine
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormData(DEFAULT_DESIGN)} className="rounded-xl h-11 px-6 font-bold gap-2 bg-white">
            <RotateCcw size={16} /> Reset A4 Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Design
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 🛠️ EDITOR SIDEBAR */}
        <div className="lg:col-span-5 space-y-6">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="bg-white border p-1 h-12 rounded-xl w-full shadow-sm">
              <TabsTrigger value="layout" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Maximize size={14}/> Layout</TabsTrigger>
              <TabsTrigger value="typo" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Type size={14}/> Typography</TabsTrigger>
              <TabsTrigger value="content" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Layers size={14}/> Elements</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6 mt-4">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase">Geometry & Spacing</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Header Top Gap</Label><span className="text-[10px] font-bold text-primary">{formData.headerPaddingTop}px</span></div>
                    <Slider value={[formData.headerPaddingTop]} max={100} step={1} onValueChange={([v]) => updateField('headerPaddingTop', v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Section Gap</Label><span className="text-[10px] font-bold text-primary">{formData.sectionSpacing}px</span></div>
                    <Slider value={[formData.sectionSpacing]} max={50} step={1} onValueChange={([v]) => updateField('sectionSpacing', v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Table Row Height</Label><span className="text-[10px] font-bold text-primary">{formData.tableRowPadding}px</span></div>
                    <Slider value={[formData.tableRowPadding]} max={30} step={1} onValueChange={([v]) => updateField('tableRowPadding', v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Signature Area Gap</Label><span className="text-[10px] font-bold text-primary">{formData.signatureSpacing}px</span></div>
                    <Slider value={[formData.signatureSpacing]} max={100} step={1} onValueChange={([v]) => updateField('signatureSpacing', v)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typo" className="space-y-6 mt-4">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase">Fonts & Colors</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Theme Base Color</Label>
                      <Input type="color" value={formData.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} className="h-10 p-1 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Logo Scale (px)</Label>
                      <Input type="number" value={formData.logoSize} onChange={e => updateField('logoSize', parseInt(e.target.value) || 0)} className="h-10 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Table Font Size</Label><span className="text-[10px] font-bold text-primary">{formData.tableFontSize}px</span></div>
                    <Slider value={[formData.tableFontSize]} min={8} max={20} step={0.5} onValueChange={([v]) => updateField('tableFontSize', v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Header Title Size</Label><span className="text-[10px] font-bold text-primary">{formData.headerFontSize}px</span></div>
                    <Slider value={[formData.headerFontSize]} min={16} max={48} step={1} onValueChange={([v]) => updateField('headerFontSize', v)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6 mt-4">
               <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase">Dynamic Elements</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Table Grid Lines</Label>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">SHOW BORDER BETWEEN ROWS</p>
                      </div>
                      <Switch checked={formData.showGridLines} onCheckedChange={v => updateField('showGridLines', v)} />
                   </div>

                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Custom Top Announcement</Label>
                     <Input value={formData.customTopText} onChange={e => updateField('customTopText', e.target.value)} placeholder="e.g. 10% Discount applied on all services!" className="h-11 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                   </div>

                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Custom Footer Message</Label>
                     <Textarea value={formData.customBottomText} onChange={e => updateField('customBottomText', e.target.value)} placeholder="e.g. This quote is special for our regular clients..." className="bg-gray-50 border-none rounded-xl text-xs" />
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4 shadow-inner">
             <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={24}/></div>
             <div className="space-y-1">
                <h4 className="text-sm font-black uppercase text-blue-900">Designer Rule</h4>
                <p className="text-[10px] font-medium text-blue-800/70 leading-relaxed uppercase">
                  এই প্যানেল থেকে করা পরিবর্তনগুলো স্বয়ংক্রিয়ভাবে আপনার ডাটাবেসে সেভ হবে। প্রিন্ট করার সময় এই স্টাইলগুলো সরাসরি পিডিএফ-এ যুক্ত হবে।
                </p>
             </div>
          </div>
        </div>

        {/* 👁️ REAL-TIME LIVE PREVIEW (Simulated A4) */}
        <div className="lg:col-span-7 sticky top-6">
           <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                 <Monitor size={14} className="text-primary"/>
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">A4 Scale Simulation (50%)</span>
              </div>
              
              <div 
                className="bg-white shadow-[0_40px_80px_rgba(0,0,0,0.1)] relative origin-top scale-[0.6] md:scale-[0.8] lg:scale-[0.65] xl:scale-[0.75] transition-all duration-300"
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm',
                  borderTop: `14px solid ${formData.primaryColor}`,
                  borderRadius: '0 0 1.5rem 1.5rem'
                }}
              >
                {/* PREVIEW CONTENT */}
                <header 
                  className="flex justify-between items-start border-b-2 border-gray-50 px-12 mb-4"
                  style={{ paddingTop: `${formData.headerPaddingTop}px`, paddingBottom: `${formData.headerPaddingBottom}px` }}
                >
                  <div className="flex gap-4">
                    <div className="relative bg-gray-50 rounded-xl flex items-center justify-center text-gray-300" style={{ width: `${formData.logoSize}px`, height: `${formData.logoSize}px` }}>
                      <ImageIcon size={formData.logoSize / 2} />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <h2 className="font-black tracking-tighter uppercase leading-none" style={{ fontSize: `${formData.headerFontSize}px`, color: '#081621' }}>SMART CLEAN</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: formData.primaryColor }}>Professional Excellence</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-gray-700 uppercase">MOHAKHALI, DHAKA, BD</p>
                    <p className="text-[10px] font-bold text-[#081621] uppercase">Cell: <span className="font-black">+8801919640422</span></p>
                  </div>
                </header>

                <div className="px-12 space-y-6" style={{ marginTop: `${formData.sectionSpacing}px` }}>
                  {formData.customTopText && (
                    <div className="p-3 text-center rounded-xl font-black uppercase text-[10px] animate-pulse" style={{ backgroundColor: `${formData.primaryColor}10`, color: formData.primaryColor }}>
                      {formData.customTopText}
                    </div>
                  )}

                  <div className="flex justify-between items-end border-b pb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400">Bill Recipient</p>
                      <h4 className="text-xl font-black uppercase text-[#081621]">KARIM AHMED</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400">Reference</p>
                      <p className="text-lg font-black text-[#081621] font-mono">QTN/SM/2026-1001</p>
                    </div>
                  </div>

                  {/* TABLE PREVIEW */}
                  <div className={cn("overflow-hidden rounded-xl", formData.showGridLines ? "border-2 border-[#081621]" : "border-none shadow-sm")}>
                    <table className="w-full border-collapse">
                      <thead className="text-white" style={{ backgroundColor: '#081621' }}>
                        <tr>
                          <th className="py-3 px-4 text-left font-black uppercase text-[11px]">Component</th>
                          <th className="py-3 px-4 text-center font-black uppercase text-[11px]">Qty</th>
                          <th className="py-3 px-4 text-right font-black uppercase text-[11px]">Price</th>
                          <th className="py-3 px-4 text-right font-black uppercase text-[11px]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(i => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-4 font-bold text-gray-900" style={{ fontSize: `${formData.tableFontSize}px`, paddingTop: `${formData.tableRowPadding}px`, paddingBottom: `${formData.tableRowPadding}px` }}>
                              Premium Deep Cleaning Service Item #{i}
                            </td>
                            <td className="px-4 text-center font-black text-gray-500" style={{ fontSize: `${formData.tableFontSize}px` }}>1000 Sqft</td>
                            <td className="px-4 text-right font-bold text-gray-400" style={{ fontSize: `${formData.tableFontSize}px` }}>৳12.00</td>
                            <td className="px-4 text-right font-black text-[#081621]" style={{ fontSize: `${formData.tableFontSize}px` }}>৳12,000</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: `${formData.primaryColor}05` }}>
                          <td colSpan={3} className="py-4 px-8 text-right font-black uppercase text-[12px]">Net Grand Total</td>
                          <td className="py-4 px-4 text-right font-black text-xl" style={{ color: formData.primaryColor }}>৳36,000/-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4" style={{ marginTop: `${formData.signatureSpacing}px` }}>
                     <div className="flex justify-between items-end pt-12">
                        <div className="text-center w-48 border-t-2 border-gray-100 pt-2 font-black uppercase text-[10px]">Client Sign</div>
                        <div className="text-center w-48 border-t-2 border-gray-100 pt-2 font-black uppercase text-[10px]">Authorized Sign</div>
                     </div>
                  </div>

                  <div className="pt-10 space-y-4 border-t border-gray-50">
                    <p className="text-center font-black uppercase tracking-widest" style={{ fontSize: `${formData.taglineFontSize}px`, color: formData.primaryColor }}>{formData.tagline}</p>
                    {formData.customBottomText && <p className="text-center text-[10px] text-gray-500 italic max-w-lg mx-auto">{formData.customBottomText}</p>}
                    <p className="text-center text-gray-300 font-bold uppercase tracking-[0.4em]" style={{ fontSize: `${formData.disclaimerFontSize}px` }}>{formData.footerDisclaimer}</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
