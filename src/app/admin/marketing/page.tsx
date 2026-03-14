
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
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
  Layout, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  CheckCircle2,
  Tag,
  Clock,
  Gift,
  Trophy,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function MarketingAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Firestore Data
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), orderBy('placement', 'asc')) : null, [db]);
  const campaignsQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_campaigns'), orderBy('endDate', 'desc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);

  const { data: offers, isLoading: offersLoading } = useCollection(offersQuery);
  const { data: campaigns, isLoading: campaignsLoading } = useCollection(campaignsQuery);
  const { data: products } = useCollection(productsQuery);

  const handleToggleStatus = async (col: string, id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, col, id), { enabled: !current });
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

  const handleAddCampaign = async () => {
    if (!db) return;
    await addDoc(collection(db, 'marketing_campaigns'), {
      title: 'New Campaign',
      type: 'percent_discount',
      enabled: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      bannerUrl: 'https://picsum.photos/seed/new-camp/1200/600',
      terms: 'Standard campaign terms apply.'
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
                  <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Switch 
                      checked={offer.enabled} 
                      onCheckedChange={() => handleToggleStatus('marketing_offers', offer.id, offer.enabled)} 
                    />
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Offer Title</Label>
                      <Input 
                        defaultValue={offer.title} 
                        onBlur={(e) => updateDoc(doc(db!, 'marketing_offers', offer.id), { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placement</Label>
                      <Select 
                        defaultValue={offer.placement} 
                        onValueChange={(val) => updateDoc(doc(db!, 'marketing_offers', offer.id), { placement: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top Banner</SelectItem>
                          <SelectItem value="middle">Middle Section</SelectItem>
                          <SelectItem value="before_products">Before Products</SelectItem>
                          <SelectItem value="after_products">After Products</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input 
                      defaultValue={offer.imageUrl} 
                      onBlur={(e) => updateDoc(doc(db!, 'marketing_offers', offer.id), { imageUrl: e.target.value })}
                    />
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

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Active Campaigns</h2>
            <Button onClick={handleAddCampaign} className="gap-2 font-bold"><Plus size={16} /> Create Campaign</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns?.map((camp) => (
              <Card key={camp.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      {camp.type === 'lucky_draw' ? <Trophy size={20} /> : <Gift size={20} />}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{camp.title}</CardTitle>
                      <CardDescription className="text-xs">Type: {camp.type?.replace('_', ' ').toUpperCase()}</CardDescription>
                    </div>
                  </div>
                  <Switch 
                    checked={camp.enabled} 
                    onCheckedChange={() => handleToggleStatus('marketing_campaigns', camp.id, camp.enabled)} 
                  />
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="datetime-local" defaultValue={camp.startDate?.slice(0, 16)} onChange={(e) => updateDoc(doc(db!, 'marketing_campaigns', camp.id), { startDate: new Date(e.target.value).toISOString() })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="datetime-local" defaultValue={camp.endDate?.slice(0, 16)} onChange={(e) => updateDoc(doc(db!, 'marketing_campaigns', camp.id), { endDate: new Date(e.target.value).toISOString() })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Promo Type</Label>
                    <Select defaultValue={camp.type} onValueChange={(val) => updateDoc(doc(db!, 'marketing_campaigns', camp.id), { type: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat_discount">Flat Discount</SelectItem>
                        <SelectItem value="percent_discount">Percentage Discount</SelectItem>
                        <SelectItem value="free_gift">Free Gift</SelectItem>
                        <SelectItem value="lucky_draw">Lucky Draw / Lottery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea 
                      defaultValue={camp.terms} 
                      className="min-h-[100px]"
                      onBlur={(e) => updateDoc(doc(db!, 'marketing_campaigns', camp.id), { terms: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="ghost" size="sm" className="text-destructive gap-2" onClick={() => handleDelete('marketing_campaigns', camp.id)}>
                      <Trash2 size={14} /> Remove Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
