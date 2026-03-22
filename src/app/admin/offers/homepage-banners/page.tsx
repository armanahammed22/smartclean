'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  ImageIcon, 
  Loader2,
  Layout,
  ExternalLink
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';

export default function HomepageBannersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), orderBy('placement', 'asc')) : null, [db]);
  const { data: offers, isLoading } = useCollection(offersQuery);

  const handleToggleStatus = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'marketing_offers', id), { enabled: !current });
    toast({ title: "Banner Visibility Updated" });
  };

  const handleUpdateField = async (id: string, data: any) => {
    if (!db) return;
    await updateDoc(doc(db, 'marketing_offers', id), data);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this banner?")) return;
    await deleteDoc(doc(db, 'marketing_offers', id));
    toast({ title: "Deleted Successfully" });
  };

  const handleAddOffer = async () => {
    if (!db) return;
    await addDoc(collection(db, 'marketing_offers'), {
      title: 'New Display Banner',
      placement: 'middle',
      enabled: false,
      imageUrl: '',
      link: '#'
    });
    toast({ title: "Draft Created" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Homepage Banners</h1>
          <p className="text-muted-foreground text-sm font-medium">Visual promotion blocks scattered across the landing page</p>
        </div>
        <Button onClick={handleAddOffer} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Section Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : offers?.map((offer) => (
          <Card key={offer.id} className="border-none shadow-sm overflow-hidden bg-white rounded-3xl group border border-gray-100">
            <ImageUploader 
              initialUrl={offer.imageUrl}
              aspectRatio="aspect-[21/7]"
              onUpload={(url) => handleUpdateField(offer.id, { imageUrl: url })}
            />
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Asset Label</Label>
                  <Input 
                    defaultValue={offer.title} 
                    onBlur={(e) => handleUpdateField(offer.id, { title: e.target.value })} 
                    className="h-11 border-none bg-gray-50 focus:bg-white font-bold text-lg rounded-xl"
                  />
                </div>
                <div className="flex flex-col items-end gap-2 ml-6">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active</Label>
                  <Switch checked={offer.enabled} onCheckedChange={() => handleToggleStatus(offer.id, offer.enabled)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Layout Placement</Label>
                  <Select defaultValue={offer.placement} onValueChange={(val) => handleUpdateField(offer.id, { placement: val })}>
                    <SelectTrigger className="h-11 bg-gray-50 border-none font-bold rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="top">Global Header Extension</SelectItem>
                      <SelectItem value="middle">Middle Content Break</SelectItem>
                      <SelectItem value="before_products">Pre-Collection Highlight</SelectItem>
                      <SelectItem value="after_products">Post-Collection Callout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Action URL</Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <Input 
                      defaultValue={offer.link} 
                      onBlur={(e) => handleUpdateField(offer.id, { link: e.target.value })} 
                      className="h-11 pl-10 bg-gray-50 border-none font-mono text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(offer.id)}>
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!offers?.length && !isLoading && (
          <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Layout size={48} className="opacity-20" />
            <p className="font-bold">No section banners configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}
