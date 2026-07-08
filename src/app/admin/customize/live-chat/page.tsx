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
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Save, 
  Loader2, 
  Zap,
  Globe,
  Code2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Bot,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CHAT_PROVIDERS = [
  { id: 'tawk', label: 'Tawk.to', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'tidio', label: 'Tidio', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'crisp', label: 'Crisp', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'intercom', label: 'Intercom', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'hubspot', label: 'HubSpot Chat', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'facebook', label: 'FB Messenger', color: 'text-blue-700', bg: 'bg-blue-50' },
  { id: 'whatsapp', label: 'WhatsApp Widget', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'custom', label: 'Custom Widget', color: 'text-gray-600', bg: 'bg-gray-50' }
];

export default function LiveChatManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'live_chat') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    isEnabled: true,
    provider: 'tawk',
    embedScript: '',
    apiKey: '',
    widgetId: '',
    appId: '',
    customCss: '',
    customJs: ''
  });

  useEffect(() => {
    if (config) {
      setFormData({
        isEnabled: config.isEnabled ?? true,
        provider: config.provider || 'tawk',
        embedScript: config.embedScript || '',
        apiKey: config.apiKey || '',
        widgetId: config.widgetId || '',
        appId: config.appId || '',
        customCss: config.customCss || '',
        customJs: config.customJs || ''
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'live_chat'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Configuration Published", description: "Chat settings updated across the platform." });
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
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Live Chat Control</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <MessageCircle className="text-primary" size={16}/> Connect with visitors in real-time
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Protocol
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20"><Bot size={24} /></div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Active Provider</CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase text-[9px]">Select and configure your chat tool</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10">
                  <Label className="text-[10px] font-black uppercase text-white/60">System Status</Label>
                  <Switch checked={formData.isEnabled} onCheckedChange={v => setFormData({...formData, isEnabled: v})} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Choose Service</Label>
                  <Select value={formData.provider} onValueChange={v => setFormData({...formData, provider: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {CHAT_PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id} className="py-3 font-bold text-xs uppercase">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", p.id === formData.provider ? "bg-primary" : "bg-gray-200")} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">App ID / Widget ID</Label>
                  <Input value={formData.widgetId} onChange={e => setFormData({...formData, widgetId: e.target.value})} placeholder="e.g. 5f48..." className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Primary Embed Script</Label>
                  <Badge variant="outline" className="text-[8px] font-bold border-primary/20 text-primary uppercase">HTML/JS Supported</Badge>
                </div>
                <Textarea 
                  value={formData.embedScript} 
                  onChange={e => setFormData({...formData, embedScript: e.target.value})}
                  placeholder="Paste your chat provider's installation script here..."
                  className="min-h-[200px] bg-gray-50 border-none rounded-2xl font-mono text-[11px] p-6 focus:bg-white transition-all shadow-inner leading-relaxed"
                />
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 mt-1 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                    Security Sync: All scripts are sanitized before rendering. Standard tracking scripts work instantly after save.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-3"><Code2 size={20}/> Advanced Injections</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Custom API Key</Label>
                    <Input value={formData.apiKey} onChange={e => setFormData({...formData, apiKey: e.target.value})} placeholder="Secret Key (if required)" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Custom App ID</Label>
                    <Input value={formData.appId} onChange={e => setFormData({...formData, appId: e.target.value})} placeholder="APP_ID_REF" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Custom CSS Styling</Label>
                    <Textarea value={formData.customCss} onChange={e => setFormData({...formData, customCss: e.target.value})} placeholder=".chat-widget { bottom: 20px !important; }" className="h-24 bg-gray-50 border-none rounded-xl font-mono text-[10px]" />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#F0F9FF] rounded-3xl p-8 border border-blue-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={20}/></div>
                <h4 className="text-sm font-black uppercase text-blue-900">Integration Tips</h4>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-blue-800/80 leading-relaxed uppercase">
                    ১. আপনার পছন্দের প্রোভাইডারের (যেমন Tawk.to) ড্যাশবোর্ডে গিয়ে "Widget Code" বা "Embed Script" কপি করুন।
                  </p>
                  <p className="text-[11px] font-bold text-blue-800/80 leading-relaxed uppercase">
                    ২. বাম পাশের বক্সে কোডটি পেস্ট করুন।
                  </p>
                  <p className="text-[11px] font-bold text-blue-800/80 leading-relaxed uppercase">
                    ৩. "Publish Protocol" বাটনে ক্লিক করুন।
                  </p>
                </div>
                <div className="pt-4 border-t border-blue-200">
                   <div className="flex items-center gap-2 text-blue-900 mb-3">
                      <ShieldCheck size={16}/>
                      <span className="text-[10px] font-black uppercase">Live Connection Status</span>
                   </div>
                   <div className={cn("p-4 rounded-2xl flex items-center justify-between border-2", formData.isEnabled && formData.embedScript ? "bg-white border-green-500" : "bg-white border-gray-100 opacity-50")}>
                      <span className="text-[10px] font-black uppercase">{formData.isEnabled && formData.embedScript ? 'Synchronized' : 'Offline'}</span>
                      <div className={cn("w-2 h-2 rounded-full", formData.isEnabled && formData.embedScript ? "bg-green-50 animate-pulse" : "bg-gray-300")} />
                   </div>
                </div>
             </div>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl p-8 border border-gray-100">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Quick Docs</h4>
            <div className="space-y-3">
              {CHAT_PROVIDERS.map(p => (
                <a key={p.id} href={`https://www.google.com/search?q=${p.label}+embed+script+setup`} target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group">
                   <span className="text-[10px] font-bold text-gray-600 uppercase">{p.label} Setup</span>
                   <ExternalLink size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
