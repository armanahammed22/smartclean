
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
  ShieldCheck, 
  Save, 
  Loader2, 
  Zap,
  Lock,
  Globe,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CAPISetupPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marketing') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    accessToken: '',
    capiEnabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        accessToken: config.accessToken || '',
        capiEnabled: config.capiEnabled ?? true,
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
      toast({ title: "CAPI Configuration Saved" });
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Conversion API (CAPI)</h1>
          <p className="text-muted-foreground text-sm font-medium">Server-side tracking for maximum data accuracy</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Update Token
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl text-primary"><ShieldCheck size={20} /></div>
                  Secure Server Sync
                </CardTitle>
                <Switch 
                  checked={formData.capiEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, capiEnabled: val})} 
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest flex items-center gap-2">
                  <Lock size={12} className="text-primary"/> System Access Token
                </Label>
                <Textarea 
                  value={formData.accessToken} 
                  onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                  placeholder="Paste your Facebook Access Token here..."
                  className="min-h-[120px] bg-gray-50 border-none rounded-2xl font-mono text-xs focus:bg-white transition-all p-6"
                />
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-700">
                  <AlertTriangle size={14} /> NEVER share this token. It stays server-side for security.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={18}/></div>
                  <div>
                    <h5 className="font-bold text-xs uppercase">Deduplication</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Unique event_id generated for every action to avoid double-counting.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={18}/></div>
                  <div>
                    <h5 className="font-bold text-xs uppercase">Hashing (SHA-256)</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">User email and phone are securely hashed before reaching Facebook.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe size={18} className="text-primary" /> Why use CAPI?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Standard browser tracking is often blocked by ad-blockers and iOS privacy settings. 
              </p>
              <ul className="space-y-3">
                {[
                  "Bypasses Ad-Blockers",
                  "Improves Ad Match Quality",
                  "Tracks iOS 14.5+ users",
                  "Ensures Purchase accuracy"
                ].map((point, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                    <Zap size={14} className="text-primary" fill="currentColor" /> {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
