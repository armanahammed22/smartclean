'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Save, Loader2, Globe, Layers, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TagManagerSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [id, setId] = useState('');

  useEffect(() => {
    if (settings) {
      setId(settings.googleTagManagerId || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), { googleTagManagerId: id }, { merge: true });
      toast({ title: "GTM Updated", description: "Your tag container is now active." });
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
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Google Tag Manager (GTM)</h1>
        <p className="text-muted-foreground text-sm font-medium">Inject tracking scripts dynamically without touching code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Trophy size={24} className="text-primary" /> Container Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">GTM Container ID</Label>
                <Input 
                  value={id} 
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. GTM-XXXXXXX"
                  className="h-14 bg-gray-50 border-none rounded-xl font-mono text-lg focus:bg-white transition-all px-6"
                />
              </div>

              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><Layers size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs text-amber-900">Advanced Deployment</h4>
                  <p className="text-xs text-amber-800/70 leading-relaxed font-medium">
                    Use GTM to manage Facebook Pixels, Hotjar, and other 3rd party scripts efficiently.
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Update Container
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-[#081621] rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-base font-black uppercase tracking-widest text-primary">Global Injection</h3>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Tag Manager scripts are automatically injected into the <code>head</code> and <code>body</code> of every page on this site.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
              <Zap size={14} fill="currentColor" /> Enterprise Ready Deployment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
