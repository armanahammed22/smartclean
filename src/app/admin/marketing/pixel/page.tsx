
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Tag, 
  Save, 
  Loader2, 
  ShieldCheck, 
  Info,
  Code,
  MousePointer2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PixelSetupPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marketing') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    pixelId: '',
    trackingEnabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        pixelId: config.pixelId || '',
        trackingEnabled: config.trackingEnabled ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'marketing'), {
        ...config,
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Pixel Configuration Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Facebook Pixel (Browser)</h1>
          <p className="text-muted-foreground text-sm font-medium">Standard browser-side tracking for Facebook Ads</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Apply Config
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><Code size={20} /></div>
                  Pixel Identity
                </CardTitle>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Master Toggle</Label>
                  <Switch 
                    checked={formData.trackingEnabled} 
                    onCheckedChange={(val) => setFormData({...formData, trackingEnabled: val})} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Facebook Pixel ID</Label>
                <Input 
                  value={formData.pixelId} 
                  onChange={(e) => setFormData({...formData, pixelId: e.target.value})}
                  placeholder="e.g. 123456789012345"
                  className="h-14 bg-gray-50 border-none rounded-2xl font-mono text-lg focus:bg-white transition-all px-6"
                />
                <p className="text-[10px] text-muted-foreground font-medium px-1 flex items-center gap-1">
                  <Info size={12} /> Found in Facebook Events Manager Settings.
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><ShieldCheck size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs text-blue-900 tracking-tight">Standard Events Enabled</h4>
                  <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                    Once configured, the system automatically fires <span className="font-bold">ViewContent</span>, <span className="font-bold">AddToCart</span>, and <span className="font-bold">Purchase</span> events using your dynamic product data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <ul className="space-y-4">
                {[
                  "Go to Events Manager",
                  "Select Data Sources",
                  "Click Settings tab",
                  "Copy Pixel ID",
                  "Paste here and Save"
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-medium text-white/60">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-primary border border-white/5">{i+1}</span>
                    {step}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest h-12" asChild>
                <a href="https://business.facebook.com/events_manager2/" target="_blank">Open Events Manager <ExternalLink size={14} className="ml-2"/></a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
