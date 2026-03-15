
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Grid, 
  ExternalLink,
  Smartphone,
  Tv,
  Satellite,
  Watch,
  Video,
  Plane,
  Tablet,
  Glasses,
  Thermometer,
  Camera,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { ImageUploader } from '@/components/ui/image-uploader';

const ICONS: Record<string, any> = {
  Satellite,
  Thermometer,
  Plane,
  Camera,
  Tv,
  Smartphone,
  Tablet,
  Glasses,
  Watch,
  Video,
  Grid
};

export default function QuickLinksAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ label: '', iconName: 'Grid', imageUrl: '', link: '', order: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: links, isLoading } = useCollection(linksQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.label) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_links'), {
        ...formData,
        order: Number(formData.order)
      });
      setFormData({ label: '', iconName: 'Grid', imageUrl: '', link: '', order: 0 });
      toast({ title: "Quick Link Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'quick_links', id));
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Links Grid</h1>
          <p className="text-muted-foreground text-sm">Manage the icon grid on the homepage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add New Link</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Label</Label>
                <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Starlink" className="h-11" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Lucide Icon (Fallback)</Label>
                <Select value={formData.iconName} onValueChange={val => setFormData({...formData, iconName: val})}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ICONS).map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ImageUploader 
                label="Custom Image Icon"
                initialUrl={formData.imageUrl}
                aspectRatio="aspect-square w-24"
                onUpload={(url) => setFormData({...formData, imageUrl: url})}
              />

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Redirection Link (URL)</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/category/starlink" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Sort Order</Label>
                <Input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="h-11" />
              </div>
              <Button type="submit" className="w-full gap-2 font-bold h-12 text-primary-foreground bg-primary shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                Add Navigation Link
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {links?.map((link) => {
                const Icon = ICONS[link.iconName] || Grid;
                return (
                  <Card key={link.id} className="border-none shadow-sm bg-white group rounded-2xl overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:scale-110 transition-transform relative w-16 h-16 flex items-center justify-center">
                        {link.imageUrl ? (
                          <Image src={link.imageUrl} alt={link.label || 'Link'} fill className="object-contain p-2" />
                        ) : (
                          <Icon size={32} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-900">{link.label}</h4>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{link.link}</p>
                      </div>
                      <div className="flex gap-2 w-full pt-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold" asChild>
                          <a href={link.link} target="_blank"><ExternalLink size={12} className="mr-1" /> View</a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(link.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
