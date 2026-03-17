
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Grid, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';

export default function QuickLinksAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ label: '', imageUrl: '', link: '', order: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: links, isLoading } = useCollection(linksQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.label) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_links'), { ...formData, order: Number(formData.order) });
      setFormData({ label: '', imageUrl: '', link: '', order: 0 });
      toast({ title: "Quick Link Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this link?")) return;
    await deleteDoc(doc(db, 'quick_links', id));
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Links Navigation</h1>
        <p className="text-muted-foreground text-sm">Manage the circular icon navigation on the homepage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-bold">Add New Link</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Label</Label>
                <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Services" className="h-11" />
              </div>
              <ImageUploader label="Icon Image" initialUrl={formData.imageUrl} aspectRatio="aspect-square w-20" onUpload={(url) => setFormData({...formData, imageUrl: url})} />
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Redirect Link</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/services" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Sort Order</Label>
                <Input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="h-11" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold"><Plus size={18} /> Add Link</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {links?.map((link) => (
                <Card key={link.id} className="border-none shadow-sm bg-white group rounded-2xl">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center p-3">
                      {link.imageUrl ? <Image src={link.imageUrl} alt={link.label} fill className="object-contain p-2" /> : <Grid size={24} />}
                    </div>
                    <h4 className="font-bold text-sm">{link.label}</h4>
                    <div className="flex gap-2 w-full pt-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(link.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
