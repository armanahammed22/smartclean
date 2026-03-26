'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Code, Save, Loader2, Zap, Key, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function APISettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'integrations') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    webhookUrl: '',
    apiKey: '',
    secretToken: '',
    customHeaders: ''
  });

  useEffect(() => {
    if (config) {
      setFormData({
        webhookUrl: config.webhookUrl || '',
        apiKey: config.apiKey || '',
        secretToken: config.secretToken || '',
        customHeaders: config.customHeaders || ''
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'integrations'), formData, { merge: true });
      toast({ title: "Integrations Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">API & Integrations</h1>
        <p className="text-muted-foreground text-sm font-medium">Connect external ERP or automation tools via webhooks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Code size={20} className="text-primary" /> Webhook Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Endpoint URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.webhookUrl} 
                    onChange={e => setFormData({...formData, webhookUrl: e.target.value})}
                    placeholder="https://your-erp.com/webhook"
                    className="h-12 pl-11 bg-gray-50 border-none rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">API Key</Label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      value={formData.apiKey} 
                      onChange={e => setFormData({...formData, apiKey: e.target.value})}
                      className="h-12 pl-11 bg-gray-50 border-none rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Secret Token</Label>
                  <Input 
                    type="password"
                    value={formData.secretToken} 
                    onChange={e => setFormData({...formData, secretToken: e.target.value})}
                    className="h-12 bg-gray-50 border-none rounded-xl"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Save API Config
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-900 mb-4 flex items-center gap-2">
              <Zap size={16} /> Developer Help
            </h3>
            <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
              Webhooks are triggered on:
              <ul className="mt-2 list-disc pl-4 space-y-1">
                <li>Order Creation</li>
                <li>Payment Status Change</li>
                <li>New Lead Registration</li>
              </ul>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
