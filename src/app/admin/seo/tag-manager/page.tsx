'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Save, Loader2, Globe, Layers, Zap, Code, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TagManagerSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    googleTagManagerId: '',
    gtmHeadScript: '',
    gtmBodyScript: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        googleTagManagerId: settings.googleTagManagerId || '',
        gtmHeadScript: settings.gtmHeadScript || '',
        gtmBodyScript: settings.gtmBodyScript || ''
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), formData, { merge: true });
      toast({ title: "GTM Configuration Updated", description: "Scripts are now live on the website." });
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Google Tag Manager (GTM)</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage tracking scripts directly from this terminal</p>
        </div>
        <Button onClick={handleSave} disabled={isSubmitting} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Sync GTM Logic
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Code size={24} className="text-primary" /> Advanced Script Injection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Container ID (For reference)</Label>
                <Input 
                  value={formData.googleTagManagerId} 
                  onChange={(e) => setFormData({...formData, googleTagManagerId: e.target.value})}
                  placeholder="e.g. GTM-XXXXXXX"
                  className="h-12 bg-gray-50 border-none rounded-xl font-mono text-sm focus:bg-white transition-all px-6"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Head Code (Paste from GTM)</Label>
                  <Badge variant="outline" className="text-[8px] font-bold">INJECTS INTO &lt;HEAD&gt;</Badge>
                </div>
                <Textarea 
                  value={formData.gtmHeadScript} 
                  onChange={(e) => setFormData({...formData, gtmHeadScript: e.target.value})}
                  placeholder="Paste script here... (e.g. <!-- Google Tag Manager --> ... )"
                  className="min-h-[180px] bg-gray-50 border-none rounded-2xl font-mono text-[11px] p-6 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-amber-600 ml-1 tracking-widest">Body Code (NoScript Block)</Label>
                  <Badge variant="outline" className="text-[8px] font-bold">INJECTS AFTER &lt;BODY&gt;</Badge>
                </div>
                <Textarea 
                  value={formData.gtmBodyScript} 
                  onChange={(e) => setFormData({...formData, gtmBodyScript: e.target.value})}
                  placeholder="Paste noscript here... (e.g. <noscript> ... </noscript>)"
                  className="min-h-[120px] bg-gray-50 border-none rounded-2xl font-mono text-[11px] p-6 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-900 mb-4 flex items-center gap-2">
              <Zap size={16} /> How to Setup
            </h3>
            <div className="space-y-4 text-xs text-blue-800/70 leading-relaxed font-medium">
              <p>১. আপনার Google Tag Manager একাউন্টে যান।</p>
              <p>২. কন্টেইনার সেকশন থেকে <strong>"Install Google Tag Manager"</strong> অপশনটি খুঁজুন।</p>
              <p>৩. উপরের বক্সের কোডটি কপি করে এখানে <strong>Head Code</strong> এ দিন।</p>
              <p>৪. নিচের বক্সের কোডটি কপি করে এখানে <strong>Body Code</strong> এ দিন।</p>
              <div className="p-4 bg-white rounded-xl border border-blue-100 mt-4">
                <p className="flex items-center gap-2 font-black text-blue-900 uppercase text-[9px]"><Info size={12}/> Pro Tip</p>
                <p className="mt-1 text-[10px]">এই ফিচারের মাধ্যমে আপনি কাস্টম CSS বা JS ও ইনজেক্ট করতে পারবেন।</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
