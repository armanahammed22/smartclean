
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Volume2, 
  Loader2, 
  Zap,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Star,
  Info,
  Truck,
  MessageCircle,
  Store,
  Share2,
  Heart,
  MapPin,
  ChevronRight as ChevronRightIcon,
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
        <div className="container mx-auto px-0 md:px-4 lg:py-6 max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            
            {/* COLUMN 1: Image Section (Left on Desktop) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white relative lg:rounded-lg overflow-hidden lg:shadow-sm">
                <div className="relative aspect-square lg:h-[400px] w-full overflow-hidden flex items-center justify-center">
                  {allImages.length > 0 ? (
                    <Image 
                      src={allImages[activeImageIdx]} 
                      alt={product.name} 
                      fill 
                      className="object-contain lg:object-cover p-2 lg:p-0 transition-opacity duration-300" 
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
            </div>

            {/* COLUMN 2: Details Section (Middle on Desktop) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white p-4 lg:rounded-lg lg:shadow-sm space-y-4">
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
                  <div className="bg-[#fff1eb] text-[#f85606] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                    <TicketPercent size={12} /> Extra ৳200 off with Voucher
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

                {/* Variant Selection Simulation */}
                {product.variants?.map((v: any, idx: number) => (
                  <div key={idx} className="space-y-2 pt-2 border-t border-gray-50">
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">{v.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt: string) => (
                        <button key={opt} className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-bold hover:border-[#f85606] transition-colors bg-white">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quantity Selector (Desktop only) */}
                <div className="hidden lg:flex items-center gap-6 pt-4 border-t border-gray-50">
                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-md bg-white">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50 transition-colors"><Minus size={14} /></button>
                    <span className="px-4 font-bold text-sm min-w-[40px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-50 transition-colors"><Plus size={14} /></button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:grid grid-cols-2 gap-4 pt-4">
                  <Button 
                    onClick={() => addToCart(product as any, quantity)}
                    className="h-14 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 text-white font-black uppercase tracking-widest rounded-[30px] shadow-lg border-none"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleOrderNow}
                    className="h-14 bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:opacity-90 text-white font-black uppercase tracking-widest rounded-[30px] shadow-xl shadow-green-600/20 border-none"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>

              {/* Vouchers Section */}
              <div className="bg-white p-4 lg:rounded-lg lg:shadow-sm space-y-3">
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
            </div>

            {/* COLUMN 3: Delivery & Seller Info (Right on Desktop) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-white p-4 lg:rounded-lg lg:shadow-sm space-y-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.1em]">Delivery</h3>
                  <Info size={14} className="text-gray-300" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-[#212121]">Dhaka, Dhaka North, Mohakhali</p>
                      <p className="text-[10px] text-muted-foreground">Default shipping address</p>
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

              <div className="bg-white p-4 lg:rounded-lg lg:shadow-sm space-y-4">
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
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                  <Button variant="outline" className="h-9 gap-2 text-xs font-bold text-gray-600">
                    <MessageCircle size={14} /> Chat
                  </Button>
                  <Button variant="outline" className="h-9 gap-2 text-xs font-bold text-gray-600">
                    <Store size={14} /> Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Description & More Items */}
          <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-white p-6 lg:rounded-lg lg:shadow-sm space-y-6">
                <h3 className="text-lg font-black uppercase tracking-tight text-[#212121] border-b pb-4">Product Details & Specifications</h3>
                
                {product.specifications?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                    {product.specifications.map((spec: any, idx: number) => (
                      <div key={idx} className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{spec.key}</span>
                        <span className="text-xs font-black text-gray-700">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-[#424242] leading-relaxed pt-4">
                  <p className="whitespace-pre-line text-sm font-medium">{product.description}</p>
                </div>
              </div>

              {/* Reviews Section Placeholder */}
              <div className="bg-white p-6 lg:rounded-lg lg:shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#212121]">Ratings & Reviews</h3>
                  <Button variant="ghost" className="text-[#1a9cb7] font-black text-xs">VIEW ALL</Button>
                </div>
                <div className="py-10 text-center space-y-2">
                  <Star size={40} className="mx-auto text-gray-100" />
                  <p className="text-sm font-bold text-gray-400">No reviews yet for this product.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 mt-6 lg:mt-0">
              <div className="bg-white p-4 lg:rounded-lg lg:shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#212121] uppercase tracking-tight">More from this Store</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  {moreFromStore?.slice(0, 4).map(p => (
                    <ProductCard key={p.id} product={p as any} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR (Hidden on Desktop) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center h-20 px-4 gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center gap-4 px-2 border-r pr-4 border-gray-100">
            <button className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
              <Store size={20} className="text-gray-500 group-hover:text-[#f85606]" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Store</span>
            </button>
            <button className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
              <MessageCircle size={20} className="text-gray-500 group-hover:text-[#f85606]" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Chat</span>
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <button 
              onClick={() => addToCart(product as any, quantity)}
              className="flex-1 h-12 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-black text-[10px] uppercase tracking-wider rounded-[30px] active:scale-95 transition-all shadow-md"
            >
              Add to Cart
            </button>
            <button 
              onClick={handleOrderNow}
              className="flex-1 h-12 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white font-black text-[10px] uppercase tracking-wider rounded-[30px] active:scale-95 transition-all shadow-lg"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
