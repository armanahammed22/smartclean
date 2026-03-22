'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Zap, 
  Plus, 
  Trash2, 
  ShoppingCart,
  Image as ImageIcon,
  Timer,
  Layout
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

export default function CampaignEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const campaignRef = useMemoFirebase(() => (db && id && typeof id === 'string') ? doc(db, 'campaigns', id) : null, [db, id]);
  const { data: campaign, isLoading: cLoading } = useDoc(campaignRef);

  const campaignProductsQuery = useMemoFirebase(() => {
    if (!db || !id || typeof id !== 'string') return null;
    return collection(db, 'campaigns', id, 'products');
  }, [db, id]);
  const { data: campaignItems, isLoading: itemsLoading } = useCollection(campaignProductsQuery);

  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts } = useCollection(productsRef);

  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    bannerImage: '',
    themeColor: '#000000',
    priority: 0,
    startDate: '',
    endDate: '',
    isActive: false
  });

  useEffect(() => {
    if (campaign) setFormData(campaign);
  }, [campaign]);

  const handleSaveConfig = async () => {
    if (!campaignRef) return;
    setIsSaving(true);
    try {
      await updateDoc(campaignRef, formData);
      toast({ title: "Campaign Config Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    if (!db || !id || typeof id !== 'string') return;
    const baseProduct = allProducts?.find(p => p.id === productId);
    if (!baseProduct) return;

    try {
      await addDoc(collection(db, 'campaigns', id, 'products'), {
        productId,
        discountPercent: 10,
        campaignPrice: baseProduct.price * 0.9,
        stockLimit: baseProduct.stockQuantity,
        soldCount: 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Product Added to Sale" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error adding product" });
    }
  };

  const removeProduct = async (pId: string) => {
    if (!db || !id || typeof id !== 'string') return;
    await deleteDoc(doc(db, 'campaigns', id, 'products', pId));
    toast({ title: "Product Removed from Sale" });
  };

  const updateItem = async (pId: string, field: string, val: any) => {
    if (!db || !id || typeof id !== 'string') return;
    await updateDoc(doc(db, 'campaigns', id, 'products', pId), { [field]: val });
  };

  if (cLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-10 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/campaigns')} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Event: {campaign?.title}</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Mega Sale Configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                <Layout size={18} /> Event Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <ImageUploader 
                label="Mega Banner (Desktop 1200x400)"
                initialUrl={formData.bannerImage || ''}
                onUpload={(url) => setFormData({ ...formData, bannerImage: url })}
                aspectRatio="aspect-[21/7]"
              />
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Campaign Title</Label>
                <Input value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-12 bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">URL Slug</Label>
                <Input value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="h-12 bg-gray-50 border-none font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Theme Color</Label>
                  <Input type="color" value={formData.themeColor || '#000000'} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className="h-12 p-1 bg-gray-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Priority (High first)</Label>
                  <Input type="number" value={formData.priority || 0} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} className="h-12 bg-gray-50 border-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Start Date</Label>
                  <Input type="datetime-local" value={formData.startDate?.slice(0, 16) || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="h-12 bg-gray-50 border-none text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">End Date</Label>
                  <Input type="datetime-local" value={formData.endDate?.slice(0, 16) || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="h-12 bg-gray-50 border-none text-xs" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-red-900">Active Status</Label>
                  <p className="text-[9px] font-bold text-red-700">VISIBLE TO CUSTOMERS IF ON</p>
                </div>
                <Switch checked={!!formData.isActive} onCheckedChange={(val) => setFormData({ ...formData, isActive: val })} />
              </div>
              <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Sync Event Config
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Campaign Products</CardTitle>
                <CardDescription className="text-[9px] font-black uppercase text-muted-foreground mt-1">Specific items discounted for this event</CardDescription>
              </div>
              <Select onValueChange={handleAddProduct}>
                <SelectTrigger className="w-[200px] h-10 rounded-xl font-bold uppercase text-[10px] bg-white">
                  <SelectValue placeholder="Add Product" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts?.filter(p => !campaignItems?.some(ci => ci.productId === p.id)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {campaignItems?.map((item) => {
                  const base = allProducts?.find(p => p.id === item.productId);
                  return (
                    <div key={item.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border shrink-0">
                          {base?.imageUrl && <Image src={base.imageUrl} alt={base.name} fill className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 uppercase text-xs truncate leading-tight">{base?.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Standard: ৳{base?.price?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 flex-1 w-full md:w-auto">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-red-500">Sale Price</Label>
                          <Input 
                            type="number" 
                            defaultValue={item.campaignPrice || 0} 
                            onBlur={(e) => updateItem(item.id, 'campaignPrice', parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white font-black text-xs" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-red-500">Discount %</Label>
                          <Input 
                            type="number" 
                            defaultValue={item.discountPercent || 0} 
                            onBlur={(e) => updateItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white font-black text-xs" 
                          />
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 rounded-xl hover:bg-red-50" onClick={() => removeProduct(item.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  );
                })}
                {campaignItems?.length === 0 && (
                  <div className="p-20 text-center text-muted-foreground italic text-sm">
                    No products assigned to this campaign yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
