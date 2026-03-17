
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Globe, FileText, Layout, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PageEditor() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const isNew = id === 'new';
  const pageRef = isNew ? null : (db ? doc(db, 'pages_management', id as string) : null);
  const { data: pageData, isLoading } = useDoc(pageRef);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pageData) {
      setFormData({
        title: pageData.title || '',
        slug: pageData.slug || '',
        content: pageData.content || '',
        isPublished: pageData.isPublished ?? true
      });
    }
  }, [pageData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);

    const slug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      if (isNew) {
        // Prevent duplicate slugs on new page
        const q = query(collection(db, 'pages_management'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          toast({ variant: "destructive", title: "Error", description: "Slug already exists. Choose a unique slug." });
          setIsSaving(false);
          return;
        }

        const newDocRef = doc(collection(db, 'pages_management'));
        await setDoc(newDocRef, {
          ...formData,
          slug,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, 'pages_management', id as string), {
          ...formData,
          slug,
          updatedAt: new Date().toISOString()
        });
      }

      toast({ title: "Page Content Saved" });
      router.push('/admin/pages');
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNew && isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-tight">
            {isNew ? 'Create New System Page' : 'Edit Dynamic Page'}
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Globe className="text-primary" size={12} /> Centralized Content Engine
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-primary" size={20} /> Page Definition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visible Title</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Frequently Asked Questions" 
                    className="h-12 bg-gray-50 border-none rounded-xl font-bold" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL Identifier (Slug)</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">/page/</div>
                    <Input 
                      value={formData.slug} 
                      onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                      placeholder="e.g. faq or about-us" 
                      className="h-12 pl-14 bg-gray-50 border-none rounded-xl font-mono text-xs" 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rich Content (HTML)</Label>
                  <Badge variant="outline" className="text-[8px] font-bold">Standard HTML Tags Supported</Badge>
                </div>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                  placeholder="<h1>Heading</h1><p>Start writing your page content here...</p>" 
                  className="min-h-[500px] bg-gray-50 border-none rounded-2xl p-6 font-mono text-sm leading-relaxed" 
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden sticky top-24">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings2 className="text-primary" size={18} /> Visibility Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-primary">Public Status</Label>
                  <p className="text-[10px] text-muted-foreground font-bold">{formData.isPublished ? 'VISIBLE TO CUSTOMERS' : 'HIDDEN AS DRAFT'}</p>
                </div>
                <Switch 
                  checked={formData.isPublished} 
                  onCheckedChange={(val) => setFormData({...formData, isPublished: val})} 
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-2 uppercase tracking-tight">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {isNew ? 'Create Page' : 'Save Changes'}
              </Button>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                  <Info size={12} /> Formatting Guide
                </h4>
                <div className="text-[11px] font-medium text-gray-600 leading-relaxed space-y-2">
                  <p>You can use standard HTML to format your pages:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><code>&lt;h2&gt;Section Title&lt;/h2&gt;</code></li>
                    <li><code>&lt;p&gt;Regular text paragraph.&lt;/p&gt;</code></li>
                    <li><code>&lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;</code></li>
                    <li><code>&lt;strong&gt;Bold Text&lt;/strong&gt;</code></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
