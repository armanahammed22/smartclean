'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Save, Loader2, Info, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GoogleAnalyticsSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [id, setId] = useState('');

  useEffect(() => {
    if (settings) {
      setId(settings.googleAnalyticsId || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), { googleAnalyticsId: id }, { merge: true });
      toast({ title: "Analytics Updated", description: "Google Analytics 4 is now tracking your traffic." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Google Analytics HUB</h1>
        <p className="text-muted-foreground text-sm font-medium">Integrate Google Analytics 4 (GA4) for deep visitor insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <BarChart size={24} className="text-primary" /> Tracking Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Google Measurement ID (GA4)</Label>
                <Input 
                  value={id} 
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. G-XXXXXXXXXX"
                  className="h-14 bg-gray-50 border-none rounded-xl font-mono text-lg focus:bg-white transition-all px-6"
                />
                <p className="text-[10px] text-muted-foreground font-medium px-1 flex items-center gap-1">
                  <Info size={12} /> Found in Google Analytics Admin > Data Streams > Web Stream.
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><CheckCircle2 size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs text-blue-900">Automatic Event Tracking</h4>
                  <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                    The system automatically tracks PageViews, Clicks, and E-commerce events once the ID is added.
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Save Analytics Config
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-primary text-white rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Zap size={20} /></div>
              <h3 className="font-black uppercase text-xs tracking-widest">Quick Setup</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Create a GA4 Property",
                "Add Web Data Stream",
                "Copy 'G-' Measurement ID",
                "Paste here and save"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-[11px] font-bold opacity-80">
                  <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[9px]">{i+1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  return React.useMemo(factory, deps);
}
