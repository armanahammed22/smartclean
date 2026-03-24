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
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Sparkles
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

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

  const relatedQuery = useMemoFirebase(() => {
    if (!db || !product?.categoryId) return null;
    return query(collection(db, 'products'), where('categoryId', '==', product.categoryId), limit(6));
  }, [db, product?.categoryId]);
  const { data: relatedProducts } = useCollection(relatedQuery);

  const qnaQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'product_qna'), where('productId', '==', id), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'));
  }, [db, id]);
  const { data: qnaList } = useCollection(qnaQuery);

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
    addToCart(product as any, quantity, false);
    setCheckoutOpen(true);
  };

  if (!mounted || isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#eff0f5]"><Loader2 className="animate-spin text-[#f85606]" size={40} /></div>;
  if (!product) return <div className="p-20 text-center font-bold text-muted-foreground bg-[#eff0f5] h-screen">Product Not Found</div>;

  const isOutOfStock = (product.stockQuantity || 0) <= 0;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#eff0f5] min-h-screen pb-24 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-6 max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            
            {/* COLUMN 1: Image & Gallery */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white relative lg:rounded-lg overflow-hidden lg:shadow-sm">
                <div className="relative aspect-square w-full flex items-center justify-center bg-white group">
                  {allImages.length > 0 ? (
                    <Image 
                      src={allImages[activeImageIdx]} 
                      alt={product.name} 
                      fill 
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-110" 
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <Package size={100} />
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge className="bg-[#f85606] text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black uppercase shadow-md">Premium</Badge>
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
                          "relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0",
                          activeImageIdx === idx ? "border-[#f85606]" : "border-gray-100"
                        )}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: Details */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white p-6 lg:rounded-lg lg:shadow-sm space-y-6">
                <div className="space-y-2">
                  <h1 className="text-xl md:text-2xl font-medium text-[#212121] leading-tight uppercase font-headline">
                    {product.name}
                  </h1>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#faca51]">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= 4 ? "currentColor" : "none"} className={i > 4 ? "opacity-30" : ""} />)}
                      </div>
                      <span className="text-xs text-[#1a9cb7] font-medium underline">48 Ratings</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <Share2 size={18} className="cursor-pointer hover:text-[#f85606]" />
                      <Heart size={18} className="cursor-pointer hover:text-[#f85606]" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-[#f85606]">৳{product.price.toLocaleString()}</span>
                    {discountPercent && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">৳{product.regularPrice?.toLocaleString()}</span>
                        <Badge className="bg-[#f85606]/10 text-[#f85606] border-none font-black text-[10px]">-{discountPercent}%</Badge>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[#f85606] bg-[#fff1eb] px-3 py-1 rounded-md w-fit">
                    <TicketPercent size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Extra ৳200 off with Voucher</span>
                  </div>
                </div>

                {/* Variants */}
                {product.variants?.map((v: any, idx: number) => (
                  <div key={idx} className="space-y-3 pt-4 border-t border-gray-100">
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">{v.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt: string) => (
                        <button key={opt} className="px-4 py-2 border border-gray-200 rounded-md text-xs font-bold hover:border-[#f85606] hover:text-[#f85606] transition-all bg-white shadow-sm active:scale-95">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="hidden lg:flex items-center gap-8 pt-6 border-t border-gray-100">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Quantity</p>
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-50 transition-colors border-r"><Minus size={16} /></button>
                      <span className="px-6 font-black text-sm min-w-[60px] text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50 transition-colors border-l"><Plus size={16} /></button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Stock Status</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", isOutOfStock ? "bg-red-500" : "bg-green-500")} />
                      <span className={cn("text-xs font-bold uppercase", isOutOfStock ? "text-red-600" : "text-green-600")}>
                        {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} Units Available`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-2 gap-4 pt-6">
                  <Button 
                    onClick={() => addToCart(product as any, quantity)}
                    disabled={isOutOfStock}
                    className="h-14 bg-[#2263C0] hover:bg-[#1a4f8a] text-white font-black uppercase tracking-widest rounded-xl shadow-lg border-none transition-transform active:scale-95"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleOrderNow}
                    disabled={isOutOfStock}
                    className="h-14 bg-[#f85606] hover:bg-[#d44805] text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-orange-600/20 border-none transition-transform active:scale-95"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Delivery & Seller */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-white p-5 lg:rounded-lg lg:shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Delivery Options</h3>
                  <Info size={14} className="text-gray-300" />
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-[#212121]">Dhaka, Dhaka North, Banani</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Standard Address</p>
                    </div>
                    <button className="text-[10px] font-black text-blue-600 uppercase">Change</button>
                  </div>

                  <div className="flex items-start gap-3 pt-4 border-t border-gray-50">
                    <Truck size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#212121]">Standard Delivery</p>
                        <p className="text-xs font-black text-[#212121]">৳55</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium italic">2 - 4 day(s)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-4 border-t border-gray-50">
                    <BadgeCheck className="text-green-600 mt-0.5 shrink-0" size={18} />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-[#212121]">Cash on Delivery Available</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Pay when you receive the product.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 lg:rounded-lg lg:shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#f85606] font-black border border-gray-100 shadow-inner">
                      {product.brand?.[0] || 'S'}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-[#212121] truncate max-w-[120px]">{product.brand || 'Official Store'}</p>
                      <div className="bg-green-50 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter w-fit border border-green-100">Verified Seller</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-full font-black text-[9px] uppercase tracking-tighter border-blue-200 text-blue-600">Follow</Button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Rating</p>
                    <p className="text-sm font-black text-gray-900">98%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Ship Time</p>
                    <p className="text-sm font-black text-gray-900">99%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="ghost" className="h-10 gap-2 text-[10px] font-black uppercase text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl">
                    <MessageCircle size={14} /> Chat
                  </Button>
                  <Button variant="ghost" className="h-10 gap-2 text-[10px] font-black uppercase text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl">
                    <Store size={14} /> Visit
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM TABS: Description, Specs, Reviews */}
          <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-9 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white min-h-[400px]">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="bg-gray-50/50 border-b p-0 h-14 w-full justify-start rounded-none px-4 md:px-8">
                    <TabsTrigger value="description" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f85606] data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest px-4 md:px-6">Description</TabsTrigger>
                    <TabsTrigger value="specs" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f85606] data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest px-4 md:px-6">Specifications</TabsTrigger>
                    <TabsTrigger value="reviews" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f85606] data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest px-4 md:px-6">Reviews & QNA</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6 md:p-8">
                    {/* Optimized Description */}
                    <TabsContent value="description" className="mt-0 focus-visible:ring-0">
                      <article className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-p:leading-relaxed prose-p:text-gray-600 break-words overflow-hidden">
                        <div className="text-sm md:text-base font-medium leading-loose" dangerouslySetInnerHTML={{ __html: product.description }} />
                      </article>
                    </TabsContent>

                    {/* Optimized Specifications */}
                    <TabsContent value="specs" className="mt-0 focus-visible:ring-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 md:gap-y-4">
                        {product.specifications?.map((spec: any, idx: number) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 py-3 md:py-4 group hover:bg-gray-50/50 px-2 transition-colors rounded-lg gap-1 sm:gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] shrink-0">{spec.key}</span>
                            <span className="text-sm font-bold text-gray-800 break-words">{spec.value}</span>
                          </div>
                        ))}
                        {(!product.specifications || product.specifications.length === 0) && (
                          <div className="col-span-full py-16 text-center italic text-muted-foreground uppercase font-bold text-[10px] tracking-widest">No technical details listed.</div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Optimized Reviews & QNA */}
                    <TabsContent value="reviews" className="mt-0 space-y-10 focus-visible:ring-0">
                      {/* Reviews Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-8 bg-gray-50 rounded-3xl">
                        <div className="text-center space-y-2 flex flex-col items-center justify-center">
                          <p className="text-5xl font-black text-gray-900 leading-none">4.8</p>
                          <div className="flex justify-center text-[#faca51] mt-2"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Out of 5 Stars</p>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          {[5,4,3,2,1].map(star => (
                            <div key={star} className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-gray-500 w-12">{star} Stars</span>
                              <div className="h-2 flex-1 bg-white rounded-full overflow-hidden border border-gray-100"><div className="h-full bg-[#faca51]" style={{ width: star === 5 ? '85%' : star === 4 ? '10%' : '2%' }} /></div>
                              <span className="text-[10px] font-bold text-gray-400 w-8">{star === 5 ? '85' : '10'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Q&A Section */}
                      <div className="space-y-8 pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                          <h4 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-2">
                            <MessageCircle size={20} className="text-primary" /> Customer Questions
                          </h4>
                          <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-widest h-10 px-6 border-blue-200 text-blue-600 w-full sm:w-auto">Ask a Question</Button>
                        </div>
                        <div className="space-y-8">
                          {qnaList?.length ? qnaList.map((q) => (
                            <div key={q.id} className="space-y-4 bg-white/50 p-4 rounded-2xl border border-gray-50">
                              <div className="flex gap-3">
                                <Badge className="bg-blue-100 text-blue-700 h-5 px-1.5 text-[9px] font-black shrink-0">Q</Badge>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed">{q.question}</p>
                              </div>
                              {q.answer && (
                                <div className="flex gap-3 pl-4 border-l-2 border-green-100 ml-2">
                                  <Badge className="bg-green-100 text-green-700 h-5 px-1.5 text-[9px] font-black shrink-0">A</Badge>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{q.answer}</p>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mt-2">Answered by {product.brand || 'Official Store'}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )) : (
                            <div className="py-16 text-center space-y-4">
                              <Headphones size={40} className="mx-auto text-gray-200" />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No questions yet. Be the first to ask!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>

            <div className="lg:col-span-3 mt-8 lg:mt-0 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight text-[#212121] px-2 flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Recommended
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {relatedProducts?.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center h-20 px-4 gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe-offset-2">
          <div className="flex flex-col min-w-[80px]">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Sale Price</span>
            <span className="text-xl font-black text-[#f85606] tracking-tighter leading-none">৳{(product.price * quantity).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center border border-gray-200 rounded-xl h-11 bg-gray-50 shrink-0 shadow-inner">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 h-full"><Minus size={14} className="text-gray-400" /></button>
            <span className="w-8 text-center text-xs font-black text-gray-900">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 h-full"><Plus size={14} className="text-gray-400" /></button>
          </div>

          <div className="flex-1 flex gap-2">
            <button 
              onClick={() => addToCart(product as any, quantity)}
              disabled={isOutOfStock}
              className="flex-1 h-11 bg-[#2263C0] text-white font-black text-[10px] uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg"
            >
              Cart
            </button>
            <button 
              onClick={handleOrderNow}
              disabled={isOutOfStock}
              className="flex-1 h-11 bg-[#f85606] text-white font-black text-[10px] uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-xl shadow-orange-600/20"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function BadgeCheck({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
