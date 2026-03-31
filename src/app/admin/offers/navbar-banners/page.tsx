
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Layout, 
  ChevronRight,
  ArrowUpCircle,
  ImageIcon,
  Grid,
  Search,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NavbarOffersManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [linkType, setLinkType] = useState<'custom' | 'product' | 'service' | 'landing'>('custom');
  const [formData, setFormData] = useState({
    image: '',
    link: '',
    isActive: true,
    order: 0
  });

  const offersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'offers'), orderBy('order', 'asc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const landingsQuery = useMemoFirebase(() => db ? query(collection(db, 'landing_pages'), orderBy('title', 'asc')) : null, [db]);

  const { data: offers, isLoading } = useCollection(offersQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: landings } = useCollection(landingsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.image) {
      toast({ variant: "destructive", title: "Image Required" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Offer Updated" });
      } else {
        await addDoc(collection(db, 'offers'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Offer Added" });
      }
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ image: '', link: '', isActive: true, order: (offers?.length || 0) + 1 });
    setEditingId(null);
    setLinkType('custom');
  };

  const handleEdit = (offer: any) => {
    setEditingId(offer.id);
    setFormData({
      image: offer.image,
      link: offer.link,
      isActive: offer.isActive,
      order: offer.order
    });
    setLinkType('custom');
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this offer from navbar?")) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      toast({ title: "Offer Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'offers', id), { isActive: !current });
  };

  const handleLinkSelect = (type: string, val: string) => {
    let finalLink = val;
    if (type === 'product') finalLink = `/product/${val}`;
    if (type === 'service') finalLink = `/service/${val}`;
    if (type === 'landing') finalLink = `/${val}`;
    
    setFormData({ ...formData, link: finalLink });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Navbar Circular Offers</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage rotating circular banners in the mobile bottom navigation</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
           <Grid size={16} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{offers?.length || 0} Rotating Icons</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <Card className="border-none shadow-sm sticky top-24 bg-white rounded-3xl overflow-hidden group border border-gray-100">
            <div className="h-1.5 bg-primary w-full" />
            <CardHeader className="p-8">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" />
                {editingId ? 'Edit Smart Offer' : 'Add New Smart Offer'}
              </CardTitle>
              <CardDescription className="text-xs">Select an asset and assign a destination link.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <ImageUploader 
                  label="Asset (1:1 Circle)"
                  hint="200 x 200 px"
                  initialUrl={formData.image}
                  aspectRatio="aspect-square w-32 mx-auto"
                  onUpload={(url) => setFormData({...formData, image: url})}
                />
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Link Type</Label>
                      <Select value={linkType} onValueChange={(v: any) => setLinkType(v)}>
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-none font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="custom">Manual / URL</SelectItem>
                          <SelectItem value="product">Product Link</SelectItem>
                          <SelectItem value="service">Service Link</SelectItem>
                          <SelectItem value="landing">Landing Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Display Order</Label>
                      <Input type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} className="h-11 bg-gray-50 border-none rounded-xl font-black" />
                    </div>
                  </div>

                  {linkType === 'custom' ? (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Manual Destination URL</Label>
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                        <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/page-slug" className="h-12 pl-10 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Choose Target {linkType}</Label>
                      <Select onValueChange={(val) => handleLinkSelect(linkType, val)}>
                        <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none font-bold">
                          <SelectValue placeholder={`Select a ${linkType}...`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[300px]">
                          {linkType === 'product' && products?.map(p => <SelectItem key={p.id} value={p.slug || p.id}>{p.name}</SelectItem>)}
                          {linkType === 'service' && services?.map(s => <SelectItem key={s.id} value={s.slug || s.id}>{s.title}</SelectItem>)}
                          {linkType === 'landing' && landings?.map(l => <SelectItem key={l.id} value={l.slug}>{l.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-[9px] font-bold text-primary px-1 mt-1">GENERATED: {formData.link || 'Select an item'}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <Label className="text-xs font-black uppercase">Active Status</Label>
                  <Switch checked={formData.isActive} onCheckedChange={val => setFormData({...formData, isActive: val})} />
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2" />}
                    {editingId ? 'Update Offer' : 'Add to Navbar'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={resetForm} className="rounded-2xl h-12">Cancel Edit</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-4">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers?.map((offer) => (
                <Card key={offer.id} className={cn(
                  "border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100",
                  !offer.isActive && "opacity-60 grayscale"
                )}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-16 h-16 rounded-full border-2 border-primary/10 p-0.5 shrink-0 overflow-hidden bg-gray-50 shadow-inner">
                        <Image src={offer.image} alt="Offer" fill className="object-cover rounded-full" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-gray-900 uppercase tracking-tight text-xs">POS: {offer.order}</h4>
                          {!offer.isActive && <Badge className="text-[7px] bg-gray-200 text-gray-500 h-4">DRAFT</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px] mt-1">{offer.link}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEdit(offer)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleDelete(offer.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!offers?.length && !isLoading && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                  <ArrowUpCircle size={40} className="opacity-20" />
                  <p className="font-medium">No bottom nav offers defined.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
