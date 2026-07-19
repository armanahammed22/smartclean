
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
  Phone,
  Mail,
  MapPin,
  Clock
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
    defaultTerms: '1. Quotation is valid for 7 days.\n2. 50% advance for materials if required.\n3. Service area must be cleared before team arrives.',
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
        defaultTerms: config.defaultTerms || '',
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

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Quotation Logic</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={16}/> Configure professional estimation protocols
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Protocol
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase flex items-center gap-3">Sequence & Numbering</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reference Prefix</Label>
                  <Input value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="QTN" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Next Number Starts At</Label>
                  <Input type="number" value={formData.lastNumber} onChange={e => setFormData({...formData, lastNumber: parseInt(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase">Auto Incremental Mode</Label>
                  <p className="text-[9px] font-bold text-muted-foreground">SYSTEM AUTOMATICALLY COUNTS NEXT ID</p>
                </div>
                <Switch checked={formData.autoNumberEnabled} onCheckedChange={v => setFormData({...formData, autoNumberEnabled: v})} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-base font-black uppercase">Standard Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Default Terms & Conditions</Label>
                <Textarea 
                  value={formData.defaultTerms} 
                  onChange={e => setFormData({...formData, defaultTerms: e.target.value})}
                  className="min-h-[180px] bg-gray-50 border-none rounded-2xl p-6 text-sm leading-loose"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Validity (Days)</Label>
                   <Input type="number" value={formData.defaultValidityDays} onChange={e => setFormData({...formData, defaultValidityDays: parseInt(e.target.value) || 7})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2"><FileSignature size={16}/> Authority Seal</CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-0 space-y-8">
                <ImageUploader 
                  label="Authorized Signature" 
                  initialUrl={formData.signatureUrl} 
                  onUpload={url => setFormData({...formData, signatureUrl: url})} 
                  aspectRatio="aspect-[2/1] w-40"
                />
                <ImageUploader 
                  label="Official Seal/Stamp" 
                  initialUrl={formData.sealUrl} 
                  onUpload={url => setFormData({...formData, sealUrl: url})} 
                  aspectRatio="aspect-square w-24"
                />
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                   <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                   <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                     Digital signatures are applied to the footer of every exported PDF.
                   </p>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
