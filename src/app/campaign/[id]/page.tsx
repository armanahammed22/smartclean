
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Zap, 
  Gift, 
  Trophy, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Info
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { format } from 'date-fns';

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const campaignRef = useMemoFirebase(() => db ? doc(db, 'marketing_campaigns', id as string) : null, [db, id]);
  const { data: campaign, isLoading } = useDoc(campaignRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !campaign?.productIds?.length) return null;
    return query(collection(db, 'products'), where('id', 'in', campaign.productIds));
  }, [db, campaign]);

  const { data: products } = useCollection(productsQuery);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!campaign) return <div className="p-20 text-center">Campaign Not Found</div>;

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-24">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-8 gap-2"><ArrowLeft size={18} /> Back</Button>

          <div className="space-y-12">
            {/* Hero Banner */}
            <div className="relative aspect-[21/7] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#081621]">
              <Image src={campaign.bannerUrl} alt={campaign.title} fill className="object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16">
                <div className="max-w-2xl space-y-6">
                  <Badge className="bg-primary text-white border-none py-1.5 px-4 rounded-full font-black text-xs uppercase tracking-widest">
                    Active Campaign
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-black text-white leading-tight font-headline">{campaign.title}</h1>
                  <div className="flex flex-wrap gap-4 text-white/80 font-bold">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                      <Calendar size={18} /> {format(new Date(campaign.startDate), 'MMM dd')} - {format(new Date(campaign.endDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-xl backdrop-blur-md border border-primary/30">
                      {campaign.type === 'lucky_draw' ? <Trophy size={18} /> : <Gift size={18} />}
                      {campaign.type?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Info & Terms */}
              <div className="lg:col-span-8 space-y-12">
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Campaign Description</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">{campaign.description}</p>
                  
                  <div className="pt-8 border-t space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Info size={20} className="text-primary" /> Terms & Conditions</h3>
                    <div className="p-6 bg-gray-50 rounded-2xl text-sm text-gray-600 leading-loose prose max-w-none">
                      {campaign.terms}
                    </div>
                  </div>
                </div>

                {/* Promotional Products */}
                {products && products.length > 0 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                      <Zap className="text-primary" fill="currentColor" />
                      Included Products
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {products.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Action */}
              <div className="lg:col-span-4">
                <Card className="rounded-[2rem] shadow-xl border-primary/20 sticky top-24 overflow-hidden">
                  <CardHeader className="bg-[#081621] text-white p-8">
                    <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Limited Time</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-muted-foreground uppercase">Eligibility</p>
                      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <CheckCircle2 className="text-primary shrink-0 mt-1" size={20} />
                        <p className="text-sm font-medium leading-relaxed">
                          Place any order before {format(new Date(campaign.endDate), 'MMMM dd')} to be eligible for the campaign rewards.
                        </p>
                      </div>
                    </div>

                    <Button size="lg" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" asChild>
                      <Link href="/#products">Shop Now to Enter</Link>
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Participants</p>
                        <p className="text-xl font-black">1.2k+</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Winners</p>
                        <p className="text-xl font-black">50</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
