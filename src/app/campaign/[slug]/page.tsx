'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { CountdownTimer } from '@/components/campaigns/countdown-timer';
import { ProductCard } from '@/components/products/product-card';
import { Loader2, ArrowLeft, Zap, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';

export default function CampaignLandingPage() {
  const params = useParams();
  const identifier = params.slug as string;
  
  const router = useRouter();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const campaignBySlugQuery = useMemoFirebase(() => {
    if (!db || !identifier) return null;
    return query(collection(db, 'campaigns'), where('slug', '==', identifier), limit(1));
  }, [db, identifier]);

  const { data: slugCampaigns, isLoading: slugLoading } = useCollection(campaignBySlugQuery);
  
  const campaignByIdRef = useMemoFirebase(() => (db && identifier) ? doc(db, 'campaigns', identifier) : null, [db, identifier]);
  const { data: idCampaign, isLoading: idLoading } = useDoc(campaignByIdRef);

  const campaign = useMemo(() => {
    if (slugCampaigns && slugCampaigns.length > 0) return slugCampaigns[0];
    if (idCampaign) return idCampaign;
    return null;
  }, [slugCampaigns, idCampaign]);

  const isCampaignLoading = slugLoading && idLoading;

  const campaignProductsQuery = useMemoFirebase(() => {
    if (!db || !campaign) return null;
    return collection(db, 'campaigns', campaign.id, 'products');
  }, [db, campaign]);

  const { data: campaignItems, isLoading: itemsLoading } = useCollection(campaignProductsQuery);

  const allProductsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts } = useCollection(allProductsQuery);

  const mergedProducts = useMemo(() => {
    if (!campaignItems || !allProducts) return [];
    return campaignItems.map(ci => {
      const base = allProducts.find(p => p.id === ci.productId);
      if (!base) return null;
      return {
        ...base,
        price: ci.campaignPrice || base.price,
        regularPrice: base.price, 
        isCampaignItem: true,
        discountPercent: ci.discountPercent
      };
    }).filter(p => !!p) as Product[];
  }, [campaignItems, allProducts]);

  if (!mounted) return null;

  if (isCampaignLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Mega Sale...</p>
    </div>
  );

  if (!campaign || !campaign.isActive) return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-200 mb-4">Event Unavailable</h1>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-full px-10 h-12 font-black uppercase">Return to Site</Button>
      </div>
    </PublicLayout>
  );

  const themeColor = campaign.themeColor || '#EF4444';

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-20">
        <div className="relative aspect-[21/10] md:aspect-[21/6] w-full overflow-hidden">
          <Image src={campaign.bannerImage} alt={campaign.title} fill className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-16">
            <div className="container mx-auto max-w-7xl space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border-white/10">
                  <ArrowLeft size={20} />
                </Button>
                <Badge className="bg-white text-black border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl">
                  Mega Sale Live
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic drop-shadow-2xl">
                  {campaign.title}
                </h1>
              </div>
              <div className="pt-4">
                <CountdownTimer endDate={campaign.endDate} variant="light" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl text-white" style={{ backgroundColor: themeColor }}>
                <Zap size={24} fill="currentColor" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#081621]">Campaign Catalog</h2>
            </div>
          </div>

          {itemsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
              {mergedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}