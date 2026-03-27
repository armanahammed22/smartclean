'use client';

import React, { useState } from 'react';
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
  Image as ImageIcon, 
  Layout, 
  ChevronRight,
  Eye,
  ArrowUpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function NavbarOffersManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    image: '',
    link: '',
    isActive: true,
    order: 0
  });

  const offersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'offers'), orderBy('order', 'asc')) : null, [db]);
  const { data: offers, isLoading } = useCollection(offersQuery);

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
  };

  const handleEdit = (offer: any) => {
    setEditingId(offer.id);
    setFormData({
      image: offer.image,
      link: offer.link,
      isActive: offer.isActive,
      order: offer.order
    });
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Navbar Banner Offers</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage the small circular rotating offers in the main navigation</p>
        </div>
        <div className="flex gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
           <Layout size={16} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Navbar Extension</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <Card className="border-none shadow-sm h-fit bg-white rounded-3xl overflow-hidden border border-gray-100">
          <CardHeader className="bg-[#081621] text-white p-8">
            <CardTitle className="text-lg font-black uppercase tracking-tight">
              {editingId ? 'Edit Navbar Offer' : 'Create New Offer'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <ImageUploader 
                label="Offer Image (Floating Icon)"
                hint="200 x 200 px (1:1 Ratio)"
                initialUrl={formData.image}
                aspectRatio="aspect-square w-24"
                onUpload={(url) => setFormData({...formData, image: url})}
              />
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Redirect Link</Label>
                <div className="relative">
                  <ChevronRight size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <Input 
                    value={formData.link} 
                    onChange={e => setFormData({...formData, link: e.target.value})}
                    placeholder="/campaign/eid-sale"
                    className="h-12 pl-10 bg-gray-50 border-none rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sort Order</Label>
                  <Input 
                    type="number"
                    value={formData.order} 
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="h-12 bg-gray-50 border-none rounded-xl font-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Status</Label>
                  <div className="h-12 flex items-center justify-between px-4 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold">{formData.isActive ? 'Live' : 'Draft'}</span>
                    <Switch 
                      checked={formData.isActive} 
                      onCheckedChange={val => setFormData({...formData, isActive: val})} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2" />}
                  {editingId ? 'Update Offer' : 'Add to Navbar'}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={resetForm} className="rounded-2xl h-14">Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Active Rotation</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">{offers?.length || 0} Offers</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-bold uppercase text-[10px]">Syncing Banners...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers?.map((offer) => (
                <Card key={offer.id} className={cn(
                  "border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100",
                  !offer.isActive && "opacity-60 grayscale"
                )}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-full border-2 border-primary/10 p-0.5 shrink-0">
                        <Image src={offer.image} alt="Offer" fill className="object-cover rounded-full" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-gray-900 uppercase tracking-tight text-[11px] leading-none mb-1">POS: {offer.order}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{offer.link}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Switch checked={offer.isActive} onCheckedChange={() => toggleStatus(offer.id, offer.isActive)} />
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
                <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                  <ArrowUpCircle size={48} className="opacity-20" />
                  <p className="font-medium">No offers in rotation. Use the form to add your first banner.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
