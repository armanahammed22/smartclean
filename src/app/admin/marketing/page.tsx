'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Megaphone, 
  Zap, 
  Plus, 
  Trash2, 
  Eye, 
  Tag, 
  Gift, 
  Trophy, 
  ImageIcon,
  TicketPercent,
  Calendar,
  Loader2,
  Upload
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function MarketingAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), orderBy('placement', 'asc')) : null, [db]);
  const campaignsQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_campaigns'), orderBy('endDate', 'desc')) : null, [db]);
  const couponsQuery = useMemoFirebase(() => db ? query(collection(db, 'coupons'), orderBy('code', 'asc')) : null, [db]);

  const { data: offers } = useCollection(offersQuery);
  const { data: campaigns } = useCollection(campaignsQuery);
  const { data: coupons, isLoading: cLoading } = useCollection(couponsQuery);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onUpload: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleStatus = async (col: string, id: string, current: any) => {
    if (!db) return;
    const updateVal = typeof current === 'boolean' ? !current : (current === 'Active' ? 'Inactive' : 'Active');
    await updateDoc(doc(db, col, id), col === 'coupons' ? { status: updateVal } : { enabled: updateVal });
    toast({ title: "Status Updated" });
  };

  const handleDelete = async (col: string, id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, col, id));
    toast({ title: "Deleted Successfully" });
  };

  const handleAddOffer = async () => {
    if (!db) return;
    await addDoc(collection(db, 'marketing_offers'), {
      title: 'New Offer',
      placement: 'top',
      enabled: false,
      imageUrl: 'https://picsum.photos/seed/new-offer/1200/400',
      link: '#'
    });
  };

  const handleAddCoupon = async () => {
    if (!db) return;
    await addDoc(collection(db, 'coupons'), {
      code: 'NEW' + Math.floor(Math.random() * 999),
      discountType: 'percent',
      value: 10,
      status: 'Active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h1>
          <p className="text-muted-foreground text-sm">Manage offers, banners, and discount campaigns</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" asChild>
              <Link href="/" target="_blank"><Eye size={16} /> View Live Site</Link>
           </Button>
        </div>
      </div>

      <Tabs defaultValue="offers" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap">
          <TabsTrigger value="offers" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Tag size={16} /> Offers & Banners
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap size={16} /> Marketing Campaigns
          </TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <TicketPercent size={16} /> Coupon Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Homepage Banners</h2>
            <Button onClick={handleAddOffer} className="gap-2 font-bold"><Plus size={16} /> New Offer</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers?.map((offer) => (
              <Card key={offer.id} className="border-none shadow-sm overflow-hidden bg-white rounded-2xl group">
                <div className="relative aspect-[21/7] bg-gray-50 border-b">
                  {offer.imageUrl ? (
                    <Image src={offer.imageUrl} alt={offer.title || 'Offer'} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Switch checked={offer.enabled} onCheckedChange={() => handleToggleStatus('marketing_offers', offer.id, offer.enabled)} />
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Offer Title</Label>
                      <Input defaultValue={offer.title} onBlur={(e) => updateDoc(doc(db!, 'marketing_offers', offer.id), { title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Placement</Label>
                      <Select defaultValue={offer.placement} onValueChange={(val) => updateDoc(doc(db!, 'marketing_offers', offer.id), { placement: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top Banner</SelectItem>
                          <SelectItem value="middle">Middle Section</SelectItem>
                          <SelectItem value="before_products">Before CRM Intro</SelectItem>
                          <SelectItem value="after_products">After CRM Intro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL or Upload</Label>
                    <div className="flex gap-2">
                      <Input 
                        defaultValue={offer.imageUrl?.startsWith('data:') ? 'Local Image Loaded' : offer.imageUrl} 
                        onBlur={(e) => updateDoc(doc(db!, 'marketing_offers', offer.id), { imageUrl: e.target.value })} 
                      />
                      <div className="relative">
                        <Input 
                          type="file" 
                          className="hidden" 
                          id={`offer-upload-${offer.id}`} 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, (url) => {
                            updateDoc(doc(db!, 'marketing_offers', offer.id), { imageUrl: url });
                          })}
                        />
                        <Button variant="outline" size="icon" asChild>
                          <label htmlFor={`offer-upload-${offer.id}`} className="cursor-pointer">
                            <Upload size={16} />
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <Badge variant="outline" className="uppercase text-[10px]">{offer.placement}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete('marketing_offers', offer.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Active Coupons</h2>
            <Button onClick={handleAddCoupon} className="gap-2 font-bold"><Plus size={16} /> Create Coupon</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cLoading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline" /></div>
            ) : coupons?.map((coupon) => (
              <Card key={coupon.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black font-mono text-primary tracking-tighter">{coupon.code}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <Switch checked={coupon.status === 'Active'} onCheckedChange={() => handleToggleStatus('coupons', coupon.id, coupon.status)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                    <div>
                      <Label className="text-[8px] uppercase font-black text-muted-foreground">Type</Label>
                      <Select defaultValue={coupon.discountType} onValueChange={(val) => updateDoc(doc(db!, 'coupons', coupon.id), { discountType: val })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentage</SelectItem>
                          <SelectItem value="flat">Flat BDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[8px] uppercase font-black text-muted-foreground">Value</Label>
                      <Input 
                        type="number" 
                        className="h-8 text-xs" 
                        defaultValue={coupon.value} 
                        onBlur={(e) => updateDoc(doc(db!, 'coupons', coupon.id), { value: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive h-8 px-2 gap-1 text-[10px] font-bold" onClick={() => handleDelete('coupons', coupon.id)}>
                      <Trash2 size={12} /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Marketing Campaigns</h2>
            <Button onClick={() => {}} className="gap-2 font-bold"><Plus size={16} /> New Campaign</Button>
          </div>
          <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic">
            Campaign designer coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
