
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Volume2, 
  Loader2, 
  Zap,
  Box,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  Package,
  Plus,
  Minus,
  Star,
  Info,
  ChevronLeft,
  ChevronRight,
  Truck,
  MessageCircle,
  Store,
  Share2,
  Heart,
  MapPin,
  ChevronRight as ChevronRightIcon,
  HelpCircle,
  TicketPercent,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { generateProductSpeech } from '@/ai/flows/tts-flow';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCart } from '@/components/providers/cart-provider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/products/product-card';
import { trackEvent } from '@/lib/tracking';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { addToCart, setCheckoutOpen } = useCart();
  
  const [mounted, setMounted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const productRef = useMemoFirebase(() => db ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: product, isLoading } = useDoc(productRef);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(6)) : null, [db]);
  const { data: moreFromStore } = useCollection(productsQuery);

  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), where('isEnabled', '==', true), orderBy('amount', 'asc')) : null, [db]);
  const { data: deliveryOptions } = useCollection(deliveryQuery);

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.imageUrl];
    if (product.galleryImages?.length) {
      images.push(...product.galleryImages);
    }
    return images.filter(img => !!img);
  }, [product]);

  const discountPercent = useMemo(() => {
    if (!product?.regularPrice || product.regularPrice <= product.price) return null;
    return Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100);
  }, [product]);

  // TRACK: ViewContent
  useEffect(() => {
    if (product) {
      trackEvent('ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
        content_category: product.categoryId
      });
    }
  }, [product]);

  const handleSpeak = async () => {
    if (!product || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const text = `${product.name}. Brand ${product.brand || 'Professional'}. Price ${product.price} BDT. ${product.shortDescription || ''}`;
      const url = await generateProductSpeech(text);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const handleOrderNow = () => {
    if (!product) return;
    addToCart(product as any, quantity);
    setCheckoutOpen(true);
  };

  if (!mounted || isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#eff0f5]"><Loader2 className="animate-spin text-[#f85606]" size={40} /></div>;
  if (!product) return <div className="p-20 text-center font-bold text-muted-foreground bg-[#eff0f5] h-screen">Product Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#eff0f5] min-h-screen pb-24 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-4 items-start">
            
            {/* LEFT COLUMN: Gallery & Main Info */}
            <div className="lg:col-span-8 space-y-3">
              
              <div className="bg-white relative">
                <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center">
                  {allImages.length > 0 ? (
                    <Image 
                      src={allImages[activeImageIdx]} 
                      alt={product.name} 
                      fill 
                      className="object-contain p-2 transition-opacity duration-300" 
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <Package size={100} />
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-[#f85606] text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-md">Mall</Badge>
                    <div className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 shadow-sm border border-gray-100">
                       <Truck size={12} className="text-[#00beef]" />
                       <span className="text-[9px] font-bold text-gray-700">Free Shipping</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                    {activeImageIdx + 1} / {allImages.length}
                  </div>

                  <button 
                    onClick={handleSpeak}
                    className={cn(
                      "absolute bottom-4 left-4 p-3 rounded-full bg-white/90 shadow-lg border border-gray-100 transition-transform active:scale-90",
                      isSpeaking && "animate-pulse ring-2 ring-[#f85606]"
                    )}
                  >
                    {isSpeaking ? <Loader2 className="animate-spin text-[#f85606]" size={20} /> : <Volume2 className="text-[#f85606]" size={20} />}
                  </button>
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-4 bg-white no-scrollbar border-t border-gray-50">
                    {allImages.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={cn(
                          "relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all shrink-0",
                          activeImageIdx === idx ? "border-[#f85606]" : "border-transparent"
                        )}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#f85606]">৳{product.price.toLocaleString()}</span>
                    {discountPercent && (
                      <>
                        <span className="text-sm text-gray-400 line-through">৳{product.regularPrice?.toLocaleString()}</span>
                        <span className="text-sm font-bold text-[#212121]">-{discountPercent}%</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#fff1eb] text-[#f85606] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <TicketPercent size={12} /> Extra ৳200 off with Voucher
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-base md:text-lg font-medium text-[#212121] leading-snug line-clamp-2 uppercase">
                    {product.name}
                  </h1>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#faca51]">
                        {[1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" />)}
                        <Star size={14} fill="currentColor" className="opacity-30" />
                      </div>
                      <span className="text-xs text-[#1a9cb7] font-medium">12 Ratings</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <Share2 size={18} className="cursor-pointer hover:text-[#f85606]" />
                      <Heart size={18} className="cursor-pointer hover:text-[#f85606]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#212121]">Promotions</h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase font-bold tracking-tight">1 Voucher <ChevronRightIcon size={12}/></span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  <div className="bg-[#fff1eb] border border-dashed border-[#f85606]/30 p-3 rounded-lg flex gap-4 items-center shrink-0 group active:scale-95 transition-transform cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="text-[#f85606] font-black text-sm">৳500 OFF</p>
                      <p className="text-[9px] font-medium text-gray-500">Min. Spend ৳5,000</p>
                    </div>
                    <div className="h-8 w-px bg-[#f85606]/20" />
                    <button className="text-[10px] font-black text-[#f85606] uppercase tracking-widest">Collect</button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 space-y-4">
                <h3 className="text-sm font-bold text-[#212121] uppercase tracking-tight">Product Description</h3>
                <div className="prose prose-sm max-w-none text-[#424242] leading-relaxed">
                  <p className="whitespace-pre-line text-xs font-medium">{product.description}</p>
                </div>
                <Button variant="ghost" className="w-full text-[#1a9cb7] font-bold text-xs gap-1 border-t rounded-none pt-4">
                  VIEW MORE <ChevronDown size={14} className="mt-0.5"/>
                </Button>
              </div>

            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white p-4 space-y-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.1em]">Delivery</h3>
                  <Info size={14} className="text-gray-300" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-[#212121]">Dhaka, Dhaka North, Mohakhali</p>
                      <p className="text-[10px] text-gray-400">Change location</p>
                    </div>
                    <ChevronRightIcon size={16} className="text-gray-300" />
                  </div>
                  <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                    <Truck size={18} className="text-gray-400 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#212121]">Standard Delivery</p>
                        <p className="text-xs font-black text-[#212121]">৳55</p>
                      </div>
                      <p className="text-[10px] text-gray-500">Guaranteed within 2-4 days</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#f85606] font-black border border-gray-100 shadow-sm">
                      {product.brand?.[0] || 'S'}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#212121]">{product.brand || 'Official Store'}</p>
                      <div className="bg-[#f85606] text-white text-[8px] font-black px-1 rounded-sm uppercase tracking-tighter italic w-fit">Verified</div>
                    </div>
                  </div>
                  <button className="text-[11px] text-[#1a9cb7] font-bold uppercase tracking-tight">Visit Store</button>
                </div>
              </div>

              <div className="bg-white p-4 space-y-4">
                <h3 className="text-sm font-bold text-[#212121] uppercase tracking-tight">More from Store</h3>
                <div className="grid grid-cols-2 gap-3">
                  {moreFromStore?.slice(0, 4).map(p => (
                    <ProductCard key={p.id} product={p as any} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex-1 flex items-center justify-around px-2 border-r">
            <button className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
              <Store size={20} className="text-gray-500 group-hover:text-[#f85606]" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Store</span>
            </button>
            <button className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
              <MessageCircle size={20} className="text-gray-500 group-hover:text-[#f85606]" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Chat</span>
            </button>
          </div>
          <div className="flex-[2.5] flex">
            <button 
              onClick={() => addToCart(product as any, quantity)}
              className="flex-1 bg-[#ffb900] text-white font-black text-xs uppercase tracking-tight active:brightness-90 transition-all"
            >
              Add to Cart
            </button>
            <button 
              onClick={handleOrderNow}
              className="flex-1 bg-[#f85606] text-white font-black text-xs uppercase tracking-tight active:brightness-90 transition-all"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
