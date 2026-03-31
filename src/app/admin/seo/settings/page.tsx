'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Save, Loader2, Globe, ShieldCheck, Zap, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';

export default function SEOSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImage: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        seoTitle: settings.seoTitle || '',
        seoDescription: settings.seoDescription || '',
        seoKeywords: settings.seoKeywords || '',
        ogImage: settings.ogImage || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), formData, { merge: true });
      toast({ title: "SEO Settings Published", description: "Search engines will see updated metadata." });
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Master SEO Settings</h1>
          <p className="text-muted-foreground text-sm font-medium">Global metadata configuration for Search Engines and Social Media</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Update Meta Tags
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Search size={20} className="text-primary" /> Global Meta Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Default Meta Title</Label>
                <Input 
                  value={formData.seoTitle} 
                  onChange={e => setFormData({...formData, seoTitle: e.target.value})}
                  placeholder="Smart Clean | Professional Services"
                  className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Meta Description</Label>
                <Textarea 
                  value={formData.seoDescription} 
                  onChange={e => setFormData({...formData, seoDescription: e.target.value})}
                  placeholder="Describe your services for search results..."
                  className="min-h-[120px] bg-gray-50 border-none rounded-xl p-4 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Keywords (Comma Separated)</Label>
                <Input 
                  value={formData.seoKeywords} 
                  onChange={e => setFormData({...formData, seoKeywords: e.target.value})}
                  placeholder="cleaning, dhaka, services, repair"
                  className="h-12 bg-gray-50 border-none rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50 p-8 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2"><ImageIcon className="text-primary" size={20} /> Social Sharing (OG Image)</CardTitle>
              <CardDescription>This image appears when you share your link on FB, WhatsApp, or LinkedIn.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ImageUploader 
                label="OG Image"
                hint="1200 x 630 px (Recommended)"
                initialUrl={formData.ogImage}
                onUpload={(url) => setFormData({...formData, ogImage: url})}
                aspectRatio="aspect-[1.91/1]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900 mb-4 flex items-center gap-2">
              <Zap size={16} /> Google Search Preview
            </CardTitle>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-2 shadow-sm">
              <p className="text-[#1a0dab] text-xl font-medium leading-none hover:underline cursor-pointer truncate">{formData.seoTitle || 'Smart Clean | Page Title'}</p>
              <p className="text-[#006621] text-xs leading-none">https://smartclean.com.bd › ...</p>
              <p className="text-[#545454] text-xs leading-relaxed line-clamp-3">
                {formData.seoDescription || 'Provide a high-quality meta description here to improve your organic click-through rate in search engine results.'}
              </p>
            </div>
          </Card>

          <div className="bg-[#081621] rounded-3xl p-8 text-white space-y-4">
            <h3 className="font-black uppercase text-xs text-primary tracking-widest">SEO Best Practices</h3>
            <ul className="space-y-3 text-[11px] font-medium text-white/60">
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" /> Title should be 50-60 characters</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" /> Description should be 150-160 characters</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" /> Use primary keywords at the beginning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
