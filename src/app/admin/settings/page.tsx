
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Mail, 
  Save, 
  Search, 
  Loader2,
  Link as LinkIcon,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState<any>({
    websiteName: 'Smart Clean',
    logoUrl: '',
    logoLink: '/',
    faviconUrl: '',
    appIconUrl: '',
    contactEmail: 'smartclean422@gmail.com',
    contactPhone: '+8801919640422',
    address: 'Wireless Gate, Mohakhali, Dhaka-1212',
    socialLinks: { facebook: '', instagram: '', linkedin: '', whatsapp: '' },
    currency: 'BDT',
    defaultLanguage: 'bn',
    seoTitle: 'Smart Clean | Professional Cleaning in Bangladesh',
    seoDescription: 'Expert cleaning services for home and office.',
    footerContent: '© 2026 Smart Clean Bangladesh. All rights reserved.',
    otpEnabled: false
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings,
        socialLinks: { ...formData.socialLinks, ...(settings.socialLinks || {}) }
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!db) return;
    setIsSubmitting(true);
    const docRef = doc(db, 'site_settings', 'global');
    setDoc(docRef, formData, { merge: true })
      .then(() => {
        toast({ title: "Settings Saved", description: "Global configuration updated successfully." });
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

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading Settings...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
          <p className="text-muted-foreground text-sm">Configure website core details and security</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-11 shadow-lg text-primary-foreground bg-primary">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Globe size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail size={16} /> Contact & Social
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck size={16} /> Security
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Search size={16} /> SEO & Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
              <CardDescription>Website name, logo, and core preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Website Name</Label>
                    <Input 
                      value={formData.websiteName} 
                      onChange={(e) => setFormData({...formData, websiteName: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Logo Redirection Link</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.logoLink} 
                        onChange={(e) => setFormData({...formData, logoLink: e.target.value})}
                        className="h-11 pl-10"
                        placeholder="/"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Currency Symbol</Label>
                    <Input 
                      value={formData.currency} 
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ImageUploader 
                    label="Main Site Logo"
                    initialUrl={formData.logoUrl}
                    aspectRatio="aspect-square w-24"
                    onUpload={(url) => setFormData({...formData, logoUrl: url})}
                  />
                  <ImageUploader 
                    label="Favicon (32x32)"
                    initialUrl={formData.faviconUrl}
                    aspectRatio="aspect-square w-16"
                    onUpload={(url) => setFormData({...formData, faviconUrl: url})}
                  />
                  <ImageUploader 
                    label="Mobile App Icon (Apple Touch)"
                    initialUrl={formData.appIconUrl}
                    aspectRatio="aspect-square w-24"
                    onUpload={(url) => setFormData({...formData, appIconUrl: url})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Security & Authentication</CardTitle>
              <CardDescription>Manage global security protocols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="space-y-1">
                  <Label className="text-sm font-black text-blue-900 uppercase">OTP Verification System</Label>
                  <p className="text-xs text-blue-700/70 font-medium">When enabled, users must verify their phone number via SMS OTP during login, signup, and booking.</p>
                </div>
                <Switch 
                  checked={formData.otpEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, otpEnabled: val})} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Business Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input 
                    value={formData.contactPhone} 
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input 
                    value={formData.contactEmail} 
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Physical Address</Label>
                  <Textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <Label className="text-sm font-bold block mb-4 uppercase tracking-wider text-muted-foreground">Social Media Profiles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['facebook', 'instagram', 'linkedin', 'whatsapp'].map((social) => (
                    <div key={social} className="space-y-2">
                      <Label className="capitalize">{social}</Label>
                      <Input 
                        placeholder={`https://${social}.com/yourpage`}
                        value={formData.socialLinks[social] || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          socialLinks: { ...formData.socialLinks, [social]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">SEO & Footer Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>SEO Title Tag</Label>
                <Input 
                  value={formData.seoTitle} 
                  onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={formData.seoDescription} 
                  onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Bottom Content (Copyright)</Label>
                <Input 
                  value={formData.footerContent} 
                  onChange={(e) => setFormData({...formData, footerContent: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
