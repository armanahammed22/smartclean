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
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Save, 
  Eye, 
  Loader2,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Globe,
  Settings2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ICONS: Record<string, any> = {
  MessageCircle,
  HelpCircle,
  LifeBuoy,
  Headphones
};

export default function SupportHubAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const hubRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'support_hub') : null, [db]);
  const { data: hubConfig, isLoading } = useDoc(hubRef);

  const [formData, setFormData] = useState({
    headerTitle: '',
    headerSubtitle: '',
    bodyText: '',
    buttonText: '',
    supportLink: '',
    icon: 'MessageCircle',
    isEnabled: true
  });

  useEffect(() => {
    if (hubConfig) {
      setFormData({
        headerTitle: hubConfig.headerTitle || 'Smart Clean Agent',
        headerSubtitle: hubConfig.headerSubtitle || 'Support Hub',
        bodyText: hubConfig.bodyText || '',
        buttonText: hubConfig.buttonText || 'Chat on WhatsApp',
        supportLink: hubConfig.supportLink || '',
        icon: hubConfig.icon || 'MessageCircle',
        isEnabled: hubConfig.isEnabled ?? true
      });
    }
  }, [hubConfig]);

  const handleSave = () => {
    if (!db) return;
    setIsSubmitting(true);
    
    const docRef = doc(db, 'site_settings', 'support_hub');
    setDoc(docRef, formData, { merge: true })
      .then(() => {
        toast({ title: "Hub Config Saved", description: "The floating support button has been updated." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: formData
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (isLoading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={40} /><span className="text-muted-foreground font-bold">Loading Hub Settings...</span></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Hub Management</h1>
          <p className="text-muted-foreground text-sm">Customize the floating support agent on your homepage</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <a href="/" target="_blank"><Eye size={16} /> Preview Live</a>
           </Button>
           <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg text-primary-foreground bg-primary">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Configuration
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Agent Configuration</CardTitle>
                <CardDescription>Visuals and messaging for the support popup</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-black uppercase">Enable Hub</Label>
                <Switch 
                  checked={formData.isEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, isEnabled: val})} 
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Header Title</Label>
                  <Input 
                    value={formData.headerTitle} 
                    onChange={(e) => setFormData({...formData, headerTitle: e.target.value})}
                    placeholder="e.g. Smart Clean Agent"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Header Subtitle</Label>
                  <Input 
                    value={formData.headerSubtitle} 
                    onChange={(e) => setFormData({...formData, headerSubtitle: e.target.value})}
                    placeholder="e.g. Support Hub"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Button Text</Label>
                  <Input 
                    value={formData.buttonText} 
                    onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                    placeholder="e.g. Chat on WhatsApp"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Agent Icon</Label>
                  <Select value={formData.icon} onValueChange={(val) => setFormData({...formData, icon: val})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MessageCircle"><div className="flex items-center gap-2"><MessageCircle size={14}/> Message</div></SelectItem>
                      <SelectItem value="HelpCircle"><div className="flex items-center gap-2"><HelpCircle size={14}/> Help</div></SelectItem>
                      <SelectItem value="LifeBuoy"><div className="flex items-center gap-2"><LifeBuoy size={14}/> Support</div></SelectItem>
                      <SelectItem value="Headphones"><div className="flex items-center gap-2"><Headphones size={14}/> Agent</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Body Message Text</Label>
                  <Textarea 
                    value={formData.bodyText} 
                    onChange={(e) => setFormData({...formData, bodyText: e.target.value})}
                    placeholder="Describe how you can help the customer..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Support Action Link (WhatsApp/Messenger)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.supportLink} 
                      onChange={(e) => setFormData({...formData, supportLink: e.target.value})}
                      placeholder="https://wa.me/..."
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden sticky top-24">
            <CardHeader className="border-b border-white/5 p-8">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Settings2 size={18} /> Live Preview Hint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Changes saved here will reflect instantly on the Home Page Support Hub. 
                The hub is automatically hidden on other pages to prevent UI overlap.
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    {React.createElement(ICONS[formData.icon] || MessageCircle, { size: 20, fill: "white" })}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/40">{formData.headerSubtitle}</p>
                    <p className="text-sm font-black">{formData.headerTitle}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
