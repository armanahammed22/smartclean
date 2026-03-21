'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { CountdownTimer } from './countdown-timer';
import { ChevronRight, Zap, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/product-card';

export function CampaignSection() {
  const db = useFirestore();
  
  // 1. Fetch All Campaigns
  // We fetch the collection and filter in memory to avoid "Missing Index" errors
  const campaignsRef = useMemoFirebase(() => db ? collection(db, 'campaigns') : null, [db]);
  const { data: allCampaignsRaw, isLoading: campaignsLoading } = useCollection(campaignsRef);

  // 2. Determine the Top Active Campaign in memory
  const activeCampaign = useMemo(() => {
    if (!allCampaignsRaw) return null;
    const now = new Date().toISOString();
    
    return allCampaignsRaw
      .filter(c => 
        c.isActive === true && 
        c.endDate >= now && 
        (c.startDate ? c.startDate <= now : true)
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  }, [allCampaignsRaw]);

  // 3. Fetch all products to merge details
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts } = useCollection(productsRef);

  // 4. Fetch Campaign Products (Sub-collection of the winner)
  const campaignProductsQuery = useMemoFirebase(() => {
    if (!db || !activeCampaign) return null;
    return collection(db, 'campaigns', activeCampaign.id, 'products');
  }, [db, activeCampaign]);

  const { data: campaignItems, isLoading: itemsLoading } = useCollection(campaignProductsQuery);

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

  if (campaignsLoading) return null;
  if (!activeCampaign) return null;

  // We only hide if loading is finished and there really are no products
  if (!itemsLoading && mergedProducts.length === 0) return null;

  const themeColor = activeCampaign.themeColor || '#EF4444';

  return (
    <section className="container mx-auto px-3 md:px-4 py-6">
      <div className="rounded-[2rem] overflow-hidden shadow-2xl relative bg-white border border-gray-100">
        
        {/* Banner Part */}
        <div className="relative aspect-[21/9] md:aspect-[21/6] w-full">
          <Image 
            src={activeCampaign.bannerImage || 'https://picsum.photos/seed/campaign/1200/400'} 
            alt={activeCampaign.title} 
            fill 
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center p-6 md:p-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary text-white animate-pulse">
                  <Zap size={18} fill="currentColor" />
                </div>
                <h2 className="text-xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
                  {activeCampaign.title}
                </h2>
              </div>
              <CountdownTimer endDate={activeCampaign.endDate} variant="light" />
              <Button asChild className="w-fit h-10 md:h-12 px-8 rounded-xl font-black uppercase text-xs shadow-xl transition-transform hover:scale-105" style={{ backgroundColor: themeColor }}>
                <Link href={`/campaign/${activeCampaign.slug || activeCampaign.id}`}>
                  Enter Sale <ChevronRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Slider Part */}
        <div className="p-4 md:p-8 bg-gray-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-lg font-black uppercase tracking-tight text-[#081621]">Campaign Deals</h3>
              <div className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black">MEGA SALE</div>
            </div>
            <Link href={`/campaign/${activeCampaign.slug || activeCampaign.id}`} className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
              See All Items <ChevronRight size={12} />
            </Link>
          </div>

          {itemsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : mergedProducts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {mergedProducts.map((product) => (
                <div key={product.id} className="w-[140px] md:w-[200px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-40">
              Fetching exclusive deals...
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
