'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
  Palette, 
  Save, 
  Loader2, 
  Layout, 
  Type, 
  Maximize, 
  FileText, 
  Zap, 
  RotateCcw, 
  Eye,
  Settings2,
  Table as TableIcon,
  Layers,
  ArrowRight,
  Info,
  Printer,
  FileSpreadsheet,
  ListChecks,
  Monitor,
  CheckCircle2,
  FileSignature,
  Wrench,
  X,
  Plus,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
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

export default function DocumentEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1. Design Data
  const designRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'document_design') : null, [db]);
  const { data: currentDesign, isLoading: dLoading } = useDoc(designRef);

  // 2. Quotation Logic Data
  const quoteRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);
  const { data: quoteConfig, isLoading: qLoading } = useDoc(quoteRef);

  // 3. Global/Invoice Settings
  const globalRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: globalSettings, isLoading: gLoading } = useDoc(globalRef);

  const [designForm, setDesignForm] = useState<any>(DEFAULT_DESIGN);
  const [quoteForm, setQuoteForm] = useState<any>({
    prefix: 'QTN/SM/2026',
    lastNumber: 1000,
    tagline: 'Smart Cleaning, Better Living.',
    defaultTerms: [],
    defaultValidityDays: 7,
    signatureUrl: '',
    sealUrl: ''
  });
  const [invoiceForm, setInvoiceForm] = useState<any>({
    invoiceHeaderPhone: '',
    invoiceHeaderEmail: '',
    invoiceHeaderAddress: '',
    invoiceFooterNote: '',
    invoiceFooterDisclaimer: '',
    invoiceProvidedServices: ''
  });

  useEffect(() => {
    setMounted(true);
    if (currentDesign) setDesignForm({ ...DEFAULT_DESIGN, ...currentDesign });
    if (quoteConfig) {
        setQuoteForm({
            ...quoteForm,
            ...quoteConfig,
            defaultTerms: Array.isArray(quoteConfig.defaultTerms) ? quoteConfig.defaultTerms : [quoteConfig.defaultTerms || '']
        });
    }
    if (globalSettings) {
        setInvoiceForm({
            invoiceHeaderPhone: globalSettings.invoiceHeaderPhone || '',
            invoiceHeaderEmail: globalSettings.invoiceHeaderEmail || '',
            invoiceHeaderAddress: globalSettings.invoiceHeaderAddress || '',
            invoiceFooterNote: globalSettings.invoiceFooterNote || '',
            invoiceFooterDisclaimer: globalSettings.invoiceFooterDisclaimer || '',
            invoiceProvidedServices: globalSettings.invoiceProvidedServices || ''
        });
    }
  }, [currentDesign, quoteConfig, globalSettings]);

  const handleSaveAll = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      // Sync Design
      await setDoc(doc(db, 'site_settings', 'document_design'), { ...designForm, updatedAt: new Date().toISOString() }, { merge: true });
      // Sync Quotation
      await setDoc(doc(db, 'site_settings', 'quotation'), { ...quoteForm, updatedAt: new Date().toISOString() }, { merge: true });
      // Sync Invoice/Global
      await setDoc(doc(db, 'site_settings', 'global'), { ...invoiceForm, updatedAt: new Date().toISOString() }, { merge: true });
      
      toast({ title: "Document Engine Synchronized", description: "All design and logic rules updated globally." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDesign = (key: string, val: any) => setDesignForm((p: any) => ({ ...p, [key]: val }));
  
  const addTerm = () => setQuoteForm((p: any) => ({ ...p, defaultTerms: [...p.defaultTerms, ''] }));
  const updateTerm = (idx: number, val: string) => {
    const next = [...quoteForm.defaultTerms];
    next[idx] = val;
    setQuoteForm((p: any) => ({ ...p, defaultTerms: next }));
  };
  const removeTerm = (idx: number) => setQuoteForm((p: any) => ({ ...p, defaultTerms: p.defaultTerms.filter((_: any, i: number) => i !== idx) }));

  if (!mounted || dLoading || qLoading || gLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={48} /><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Booting Document Engine...</p></div>;

  return (
    <div className="space-y-8 pb-32 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Document Control Engine</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Settings2 className="text-primary" size={16}/> Centralized logic and design for Quotations & Invoices
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={isSaving} className="h-11 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Publish Protocols</>}
        </Button>
      </div>

      <Tabs defaultValue="design" className="w-full space-y-8">
        <TabsList className="bg-white border p-1 h-14 rounded-2xl w-full max-w-4xl shadow-sm flex">
          <TabsTrigger value="design" className="flex-1 rounded-xl gap-2 text-[11px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Palette size={16}/> Design Studio</TabsTrigger>
          <TabsTrigger value="quotation" className="flex-1 rounded-xl gap-2 text-[11px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><FileSpreadsheet size={16}/> Quotation Logic</TabsTrigger>
          <TabsTrigger value="invoice" className="flex-1 rounded-xl gap-2 text-[11px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Printer size={16}/> Invoice Logic</TabsTrigger>
        </TabsList>

        {/* 🎨 TAB 1: DESIGN STUDIO (Visual Editor) */}
        <TabsContent value="design" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
               <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                  <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase">Layout & Spacing</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Header Top Gap</Label><span className="text-[10px] font-bold text-primary">{designForm.headerPaddingTop}px</span></div>
                      <Slider value={[designForm.headerPaddingTop]} max={100} step={1} onValueChange={([v]) => updateDesign('headerPaddingTop', v)} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Section Gap</Label><span className="text-[10px] font-bold text-primary">{designForm.sectionSpacing}px</span></div>
                      <Slider value={[designForm.sectionSpacing]} max={50} step={1} onValueChange={([v]) => updateDesign('sectionSpacing', v)} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Table Row Padding</Label><span className="text-[10px] font-bold text-primary">{designForm.tableRowPadding}px</span></div>
                      <Slider value={[designForm.tableRowPadding]} max={30} step={1} onValueChange={([v]) => updateDesign('tableRowPadding', v)} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Signature Area Gap</Label><span className="text-[10px] font-bold text-primary">{designForm.signatureSpacing}px</span></div>
                      <Slider value={[designForm.signatureSpacing]} max={100} step={1} onValueChange={([v]) => updateDesign('signatureSpacing', v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <Label className="text-[10px] font-black uppercase">Table Grid Lines</Label>
                      <Switch checked={designForm.showGridLines} onCheckedChange={v => updateDesign('showGridLines', v)} />
                    </div>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                  <CardHeader className="bg-gray-50/50 p-6 border-b"><CardTitle className="text-xs font-black uppercase">Typography</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Theme Primary Color</Label>
                      <Input type="color" value={designForm.primaryColor} onChange={e => updateDesign('primaryColor', e.target.value)} className="h-10 p-1 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">Table Font Size</Label><span className="text-[10px] font-bold text-primary">{designForm.tableFontSize}px</span></div>
                      <Slider value={[designForm.tableFontSize]} min={8} max={18} step={0.5} onValueChange={([v]) => updateDesign('tableFontSize', v)} />
                    </div>
                  </CardContent>
               </Card>

               <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                  <Info size={20} className="text-blue-600 mt-1" />
                  <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                    ডিজাইন স্টুডিও থেকে করা পরিবর্তনগুলো কোটিশন এবং ইনভয়েস উভয়ের জন্যই প্রযোজ্য হবে।
                  </p>
               </div>
            </div>

            <div className="lg:col-span-8 sticky top-6">
               <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full border shadow-sm">
                     <Monitor size={14} className="text-primary"/>
                     <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">A4 Scale Real-time Preview (65%)</span>
                  </div>
                  
                  <div 
                    className="bg-white shadow-[0_40px_80px_rgba(0,0,0,0.1)] relative origin-top scale-[0.65] lg:scale-[0.7] xl:scale-[0.8] transition-all duration-300"
                    style={{ 
                      width: '210mm', 
                      minHeight: '297mm',
                      borderTop: `14px solid ${designForm.primaryColor}`,
                      borderRadius: '0 0 1.5rem 1.5rem'
                    }}
                  >
                    {/* SIMULATED CONTENT */}
                    <header className="px-12 flex justify-between items-start border-b-2 border-gray-50" style={{ paddingTop: `${designForm.headerPaddingTop}px`, paddingBottom: `${designForm.headerPaddingBottom}px` }}>
                       <div className="flex gap-4">
                         <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><Layers size={24}/></div>
                         <div className="text-left"><h2 className="font-black text-2xl uppercase text-[#081621]">SMART CLEAN</h2><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: designForm.primaryColor }}>Professional Infrastructure</p></div>
                       </div>
                       <div className="text-right space-y-1"><p className="text-[10px] font-bold text-gray-600 uppercase">MOHAKHALI, DHAKA, BD</p></div>
                    </header>
                    <div className="px-12 py-10 space-y-8" style={{ marginTop: `${designForm.sectionSpacing}px` }}>
                       <div className="flex justify-between items-end border-b pb-4">
                         <div className="space-y-1"><p className="text-[10px] font-black uppercase text-gray-400">Bill Recipient</p><h4 className="text-xl font-black uppercase text-[#081621]">MR. SAMPLE CUSTOMER</h4></div>
                         <div className="text-right"><p className="text-[10px] font-black text-gray-400">Reference</p><p className="text-lg font-black text-[#081621] font-mono">QTN/SM/2026-1001</p></div>
                       </div>
                       <div className={cn("overflow-hidden rounded-xl", designForm.showGridLines ? "border-2 border-[#081621]" : "border-none shadow-sm")}>
                          <table className="w-full border-collapse">
                             <thead className="bg-[#081621] text-white">
                                <tr><th className="py-3 px-4 text-left font-black uppercase text-[11px]">Component</th><th className="py-3 px-4 text-center font-black uppercase text-[11px]">Qty</th><th className="py-3 px-4 text-right font-black uppercase text-[11px]">Price</th><th className="py-3 px-4 text-right font-black uppercase text-[11px]">Total</th></tr>
                             </thead>
                             <tbody>
                                {[1, 2].map(i => (
                                  <tr key={i} className="border-b border-gray-100">
                                    <td className="px-4 font-bold text-gray-900" style={{ fontSize: `${designForm.tableFontSize}px`, paddingTop: `${designForm.tableRowPadding}px`, paddingBottom: `${designForm.tableRowPadding}px` }}>Premium Service Item Sample #{i}</td>
                                    <td className="px-4 text-center font-black text-gray-500" style={{ fontSize: `${designForm.tableFontSize}px` }}>1000 Sqft</td>
                                    <td className="px-4 text-right font-bold text-gray-400" style={{ fontSize: `${designForm.tableFontSize}px` }}>৳12.00</td>
                                    <td className="px-4 text-right font-black text-[#081621]" style={{ fontSize: `${designForm.tableFontSize}px` }}>৳12,000</td>
                                  </tr>
                                ))}
                                <tr style={{ backgroundColor: `${designForm.primaryColor}10` }}><td colSpan={3} className="py-4 px-8 text-right font-black uppercase text-[12px]">Net Total</td><td className="py-4 px-4 text-right font-black text-xl" style={{ color: designForm.primaryColor }}>৳24,000/-</td></tr>
                             </tbody>
                          </table>
                       </div>
                       <div className="flex justify-between items-end pt-20" style={{ marginTop: `${designForm.signatureSpacing}px` }}>
                          <div className="text-center w-48 border-t-2 border-gray-100 pt-2 font-black uppercase text-[10px]">Client Sign</div>
                          <div className="text-center w-48 border-t-2 border-gray-100 pt-2 font-black uppercase text-[10px]">Authorized Sign</div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </TabsContent>

        {/* 📑 TAB 2: QUOTATION LOGIC */}
        <TabsContent value="quotation" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                   <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-3"><Layers className="text-primary" /> Numbering & Identification</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Reference Prefix</Label>
                        <Input value={quoteForm.prefix} onChange={e => setQuoteForm({...quoteForm, prefix: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Current Sequence ID</Label>
                        <Input type="number" value={quoteForm.lastNumber} onChange={e => setQuoteForm({...quoteForm, lastNumber: parseInt(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                      </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
                   <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-3"><ListChecks className="text-primary"/> Default Terms Protocol</CardTitle>
                   <Button type="button" onClick={addTerm} variant="outline" size="sm" className="rounded-xl font-black text-[9px] uppercase border-primary/20 text-primary">+ Add Rule</Button>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                   {quoteForm.defaultTerms.map((term: string, idx: number) => (
                      <div key={idx} className="flex gap-3 group items-center">
                         <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-primary shrink-0">{idx + 1}</div>
                         <Input value={term} onChange={e => updateTerm(idx, e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl text-xs font-medium" />
                         <button onClick={() => removeTerm(idx)} className="p-2 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                      </div>
                   ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                 <CardHeader className="p-8 pb-4 border-b bg-gray-50/50">
                    <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2"><FileSignature size={16}/> Authority Assets</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <ImageUploader label="Quotation Signature" hint="200 x 80 px" initialUrl={quoteForm.signatureUrl} onUpload={url => setQuoteForm({...quoteForm, signatureUrl: url})} aspectRatio="aspect-[2/1]" />
                    <ImageUploader label="Official Seal" hint="200 x 200 px" initialUrl={quoteForm.sealUrl} onUpload={url => setQuoteForm({...quoteForm, sealUrl: url})} aspectRatio="aspect-square w-24 mx-auto" />
                 </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>

        {/* 🧾 TAB 3: INVOICE LOGIC */}
        <TabsContent value="invoice" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
                <CardHeader className="bg-[#081621] text-white p-8">
                   <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3"><Printer size={20} className="text-primary" /> Invoice Business Data</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-2">Public Header Data</h4>
                        <div className="space-y-4">
                           <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Support Phone</Label><Input value={invoiceForm.invoiceHeaderPhone} onChange={e => setInvoiceForm({...invoiceForm, invoiceHeaderPhone: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" /></div>
                           <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Billing Email</Label><Input value={invoiceForm.invoiceHeaderEmail} onChange={e => setInvoiceForm({...invoiceForm, invoiceHeaderEmail: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" /></div>
                           <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Physical Office</Label><Input value={invoiceForm.invoiceHeaderAddress} onChange={e => setInvoiceForm({...invoiceForm, invoiceHeaderAddress: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-2">Footer Metadata</h4>
                        <div className="space-y-4">
                           <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Settlement Note</Label><Textarea value={invoiceForm.invoiceFooterNote} onChange={e => setInvoiceForm({...invoiceForm, invoiceFooterNote: e.target.value})} className="h-24 bg-gray-50 border-none rounded-xl text-xs" /></div>
                           <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Electronic Disclaimer</Label><Textarea value={invoiceForm.invoiceFooterDisclaimer} onChange={e => setInvoiceForm({...invoiceForm, invoiceFooterDisclaimer: e.target.value})} className="h-20 bg-gray-50 border-none rounded-xl text-[9px]" /></div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="space-y-6 pt-4 border-t">
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b pb-2 flex items-center gap-2"><CheckSquare size={14}/> Services Grid (CSV List)</h4>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">List of Services (Comma Separated)</Label>
                        <Textarea value={invoiceForm.invoiceProvidedServices} onChange={e => setInvoiceForm({...invoiceForm, invoiceProvidedServices: e.target.value})} placeholder="Service 1, Service 2..." className="h-24 bg-gray-50 border-none rounded-xl text-sm font-medium" />
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4">
               <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={20}/></div>
                    <h4 className="text-sm font-black uppercase text-blue-900">Automation Rule</h4>
                  </div>
                  <p className="text-[11px] font-medium text-blue-800/80 leading-relaxed uppercase">
                    ইনভয়েসের এই ফিল্ডগুলো শুধুমাত্র পিডিএফে ডাটা রেন্ডার করার জন্য ব্যবহৃত হয়। কোনো বুকিং সম্পন্ন হলে স্বয়ংক্রিয়ভাবে এখান থেকে লেটেস্ট কন্টেন্ট নিয়ে ইনভয়েস তৈরি হবে।
                  </p>
               </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
