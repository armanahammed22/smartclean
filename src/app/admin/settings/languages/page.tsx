'use client';

import React, { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Save, Loader2, Languages, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LanguageSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    defaultLanguage: 'bn',
    allowUserToggle: true,
    supportedLanguages: ['bn', 'en']
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        defaultLanguage: settings.defaultLanguage || 'bn',
        allowUserToggle: settings.allowUserToggle ?? true,
        supportedLanguages: settings.supportedLanguages || ['bn', 'en']
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), formData, { merge: true });
      toast({ title: "Language Config Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Localization Settings</h1>
        <p className="text-muted-foreground text-sm font-medium">Manage multi-language support and default locale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Globe size={20} className="text-primary" /> Active Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'bn', label: 'Bengali (বাংলা)', desc: 'Primary Market Language' },
                  { id: 'en', label: 'English', desc: 'Secondary Language' }
                ].map((lang) => (
                  <div key={lang.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm uppercase">{lang.label}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{lang.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.supportedLanguages.includes(lang.id)} 
                        onCheckedChange={(val) => {
                          const list = val ? [...formData.supportedLanguages, lang.id] : formData.supportedLanguages.filter(id => id !== lang.id);
                          setFormData({...formData, supportedLanguages: list});
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-sm font-black text-gray-900 uppercase">User Language Toggle</Label>
                  <p className="text-xs text-muted-foreground font-medium">Show language switcher button in site header.</p>
                </div>
                <Switch checked={formData.allowUserToggle} onCheckedChange={(val) => setFormData({...formData, allowUserToggle: val})} />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Publish Localization
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-[#081621] rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-base font-black uppercase tracking-widest text-primary">Region Target</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-400" />
                <span className="text-xs font-medium text-white/60">Timezone: UTC+6 (Dhaka)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-400" />
                <span className="text-xs font-medium text-white/60">Currency: BDT (৳)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
