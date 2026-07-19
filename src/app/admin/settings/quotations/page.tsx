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
  FileSpreadsheet, 
  Save, 
  Loader2, 
  Zap, 
  ShieldCheck, 
  Info,
  Layers,
  Settings2,
  FileSignature,
  Building2,
  Plus,
  Trash2,
  ListChecks,
  Wrench,
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';

export default function QuotationSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    prefix: 'QTN',
    lastNumber: 1000,
    tagline: 'Smart Cleaning, Better Living.',
    defaultTerms: ['Quotation is valid for 7 days.', '50% advance for materials if required.'],
    defaultFooterServices: 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control',
    footerDisclaimer: 'This document is electronically verified and ready for activation.',
    defaultValidityDays: 7,
    signatureUrl: '',
    sealUrl: '',
    showCompanyDetails: true,
    autoNumberEnabled: true
  });

  useEffect(() => {
    if (config) {
      setFormData({
        prefix: config.prefix || 'QTN',
        lastNumber: config.lastNumber || 1000,
        tagline: config.tagline || 'Smart Cleaning, Better Living.',
        defaultTerms: Array.isArray(config.defaultTerms) ? config.defaultTerms : [config.defaultTerms || ''],
        defaultFooterServices: config.defaultFooterServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control',
        footerDisclaimer: config.footerDisclaimer || 'This document is electronically verified and ready for activation.',
        defaultValidityDays: config.defaultValidityDays || 7,
        signatureUrl: config.signatureUrl || '',
        sealUrl: config.sealUrl || '',
        showCompanyDetails: config.showCompanyDetails ?? true,
        autoNumberEnabled: config.autoNumberEnabled ?? true
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'quotation'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Configuration Updated", description: "Global quotation rules applied." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTermLine = () => setFormData({ ...formData, defaultTerms: [...formData.defaultTerms, ''] });
  const updateTermLine = (idx: number, val: string) => {
    const next = [...formData.defaultTerms];
    next[idx] = val;
    setFormData({ ...formData, defaultTerms: next });
  };
  const removeTermLine = (idx: number) => setFormData({ ...formData, defaultTerms: formData.defaultTerms.filter((_, i) => i !== idx) });

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Quotation Logic Hub</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={16}/> Configure global estimation protocols & footer assets
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Protocol
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          {/* Brand & Identity */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-primary/5 p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-3 text-primary"><Type size={18} /> Branding & Taglines</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Main Tagline</Label>
                <Input value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} placeholder="Smart Cleaning, Better Living." className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary italic" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Footer Verification Disclaimer</Label>
                <Input value={formData.footerDisclaimer} onChange={e => setFormData({...formData, footerDisclaimer: e.target.value})} placeholder="E-verified document text..." className="h-12 bg-gray-50 border-none rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Sequence Config */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-3"><Layers className="text-primary" /> Sequence & Numbering</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reference Prefix</Label>
                  <Input value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="QTN" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Sequence ID</Label>
                  <Input type="number" value={formData.lastNumber} onChange={e => setFormData({...formData, lastNumber: parseInt(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl font-black shadow-inner" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manage Default T&C Lines */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><ListChecks size={18} className="text-primary"/> Default T&C Protocol</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Manage standard serial-numbered terms</p>
              </div>
              <Button type="button" onClick={addTermLine} variant="outline" size="sm" className="rounded-xl font-black text-[9px] uppercase border-primary/20 text-primary">+ Add Line</Button>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {formData.defaultTerms.map((term, idx) => (
                <div key={idx} className="flex gap-3 items-center group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-primary shrink-0">{idx + 1}</div>
                  <Input 
                    value={term} 
                    onChange={e => updateTermLine(idx, e.target.value)} 
                    className="h-11 bg-gray-50 border-none rounded-xl text-xs font-medium" 
                    placeholder="Enter condition..."
                  />
                  <button type="button" onClick={() => removeTermLine(idx)} className="text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer Service List */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
               <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><Wrench size={18} className="text-primary"/> Footer Service List</CardTitle>
               <CardDescription className="text-[9px] font-black uppercase text-muted-foreground mt-1">These will appear in a grid at the bottom of the PDF</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Services We Provide (Comma Separated)</Label>
                 <Textarea 
                    value={formData.defaultFooterServices} 
                    onChange={e => setFormData({...formData, defaultFooterServices: e.target.value})} 
                    className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-6 font-medium text-xs leading-relaxed shadow-inner"
                    placeholder="e.g. Deep Cleaning, Sofa Cleaning, Office Sanitization..."
                 />
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="p-8 pb-4 border-b bg-gray-50/50">
                <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2"><FileSignature size={16}/> Authority Assets</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <ImageUploader 
                    label="Authorized Signature" 
                    hint="200 x 80 px (PNG)" 
                    initialUrl={formData.signatureUrl} 
                    onUpload={url => setFormData({...formData, signatureUrl: url})} 
                    aspectRatio="aspect-[2/1] w-full"
                  />
                  <ImageUploader 
                    label="Official Stamp/Seal" 
                    hint="200 x 200 px" 
                    initialUrl={formData.sealUrl} 
                    onUpload={url => setFormData({...formData, sealUrl: url})} 
                    aspectRatio="aspect-square w-24 mx-auto"
                  />
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                   <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                     দয়া করে ট্রান্সপারেন্ট (Transparent) ব্যাকগ্রাউন্ডের সিগনেচার ব্যবহার করুন যাতে পিডিএফে এটি দেখতে প্রফেশনাল লাগে।
                   </p>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl bg-[#081621] text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Settings2 size={120}/></div>
              <CardContent className="p-8 relative z-10 space-y-6">
                 <h4 className="text-base font-black uppercase tracking-tight text-primary flex items-center gap-2"><Zap size={16}/> Protocol Active</h4>
                 <p className="text-white/60 text-xs font-medium leading-relaxed">
                   আপনার কোটিশন পোর্টালে ট্যাগলাইন হিসেবে <span className="text-white font-black italic">"{formData.tagline}"</span> সেট করা হয়েছে যা সকল ডকুমেন্টে অটোমেটিক দেখাবে।
                 </p>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
