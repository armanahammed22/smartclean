'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  ShieldCheck, 
  Save, 
  Loader2,
  Activity,
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react';

export default function MarketingSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marketing') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    trackingEnabled: true,
    capiEnabled: true,
    debugMode: false,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        trackingEnabled: config.trackingEnabled ?? true,
        capiEnabled: config.capiEnabled ?? true,
        debugMode: config.debugMode ?? false,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'site_settings', 'marketing'), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Tracking Configuration Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Tracking Settings</h1>
          <p className="text-muted-foreground text-sm font-medium">Control global behavior of marketing data pipes</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Save Protocol
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Settings className="text-primary" size={24} /> Master Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Zap size={24} /></div>
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-blue-900 uppercase">Global Tracking Toggle</Label>
                    <p className="text-xs text-blue-700/70 font-medium">Instantly enable/disable both Pixel and CAPI event firing across the site.</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.trackingEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, trackingEnabled: val})} 
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><ShieldCheck size={24} /></div>
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-indigo-900 uppercase">Server-Side Priority</Label>
                    <p className="text-xs text-indigo-700/70 font-medium">When enabled, the system prioritizes CAPI events for higher accuracy in ad attribution.</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.capiEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, capiEnabled: val})} 
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><Activity size={24} /></div>
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-amber-900 uppercase">Developer Debug Mode</Label>
                    <p className="text-xs text-amber-700/70 font-medium">Exposes tracking IDs and status logs in the browser console for testing.</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.debugMode} 
                  onCheckedChange={(val) => setFormData({...formData, debugMode: val})} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe size={18} className="text-primary" /> Data Ethics & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-medium text-gray-600 leading-relaxed italic">
                "Our system utilizes SHA-256 hashing for all user-identifiable data (PII) before transmission to external platforms, ensuring SOC2-grade data privacy."
              </div>
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <p className="text-[10px] font-bold text-red-700 leading-normal">
                  Warning: Disabling Global Tracking will stop all ad attribution data, potentially increasing your Facebook CPC costs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
