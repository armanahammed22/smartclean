
"use client";

import React, { useState, useEffect } from 'react';
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
  Settings2,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { generateProductSpeech } from '@/ai/flows/tts-flow';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCart } from '@/components/providers/cart-provider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), where('isEnabled', '==', true), orderBy('amount', 'asc')) : null, [db]);
  const { data: deliveryOptions } = useCollection(deliveryQuery);

  const allImages = React.useMemo(() => {
    if (!product) return [];
    const images = [product.imageUrl];
    if (product.galleryImages?.length) {
      images.push(...product.galleryImages);
    }
    return images.filter(img => !!img);
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

  if (!mounted || isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!product) return <div className="p-20 text-center font-bold text-muted-foreground">Product Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-24 lg:pb-12">
        <div className="container mx-auto px-4 py-4 md:py-8">
          
          {/* Desktop Breadcrumb */}
          <Button variant="ghost" onClick={() => router.back()} className="hidden lg:flex mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all text-gray-500 font-bold">
            <ArrowLeft size={18} /> Back to Catalog
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Image Gallery */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4 md:space-y-6">
              <div className="relative aspect-square rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl bg-white border border-gray-100 flex items-center justify-center group">
                {allImages.length > 0 ? (
                  <>
                    <Image 
                      src={allImages[activeImageIdx]} 
                      alt={product.name} 
                      fill 
                      className="object-contain p-4 md:p-12 transition-all duration-500" 
                      priority
                      unoptimized
                    />
                    {allImages.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-full shadow-lg h-10 w-10 bg-white/80 backdrop-blur-sm"
                          onClick={() => setActiveImageIdx(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        >
                          <ChevronLeft size={20} />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-full shadow-lg h-10 w-10 bg-white/80 backdrop-blur-sm"
                          onClick={() => setActiveImageIdx(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        >
                          <ChevronRight size={20} />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                    <Package size={120} />
                  </div>
                )}
                
                {/* AI Voice Assist Button */}
                <Button 
                  onClick={handleSpeak} 
                  disabled={isSpeaking}
                  className="absolute bottom-4 right-4 md:bottom-6 md:right-6 rounded-full shadow-2xl h-12 w-12 md:h-14 md:w-14 p-0 bg-white hover:bg-primary hover:text-white text-primary border-none transition-all z-10"
                >
                  {isSpeaking ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={24} />}
                </Button>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={cn(
                        "relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                        activeImageIdx === idx ? "border-primary shadow-md scale-105" : "border-gray-100 opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Product Actions */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-6 md:space-y-8">
              <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
                      {product.brand || 'Professional'}
                    </Badge>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star size={16} fill="currentColor" /> 4.8 <span className="text-gray-300 font-medium">(12)</span>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                    {product.name}
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium line-clamp-3">
                    {product.shortDescription}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-5xl font-black text-primary tracking-tighter">৳{product.price.toLocaleString()}</span>
                    {product.regularPrice > product.price && (
                      <span className="text-xl text-muted-foreground line-through decoration-red-200">৳{product.regularPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] uppercase tracking-wider">
                    <CheckCircle2 size={16} /> In Stock & Ready to Ship
                  </div>
                </div>

                {/* Delivery Zone Rates */}
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    <Truck size={16} /> Delivery Charges
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {deliveryOptions?.map(opt => (
                      <div key={opt.id} className="bg-white px-3 py-2 rounded-xl border border-blue-50 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{opt.label}</span>
                        <span className="text-xs font-black text-blue-700">৳{opt.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Quantity</span>
                    <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 scale-90 md:scale-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></Button>
                      <span className="w-8 text-center font-black text-sm">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></Button>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unit/Size</span>
                    <span className="text-xs font-black text-gray-900 uppercase">{product.size || 'Standard'}</span>
                  </div>
                </div>

                {/* Primary Actions - Desktop */}
                <div className="hidden lg:grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    className="h-16 rounded-2xl font-black text-base uppercase border-2 border-primary text-primary hover:bg-primary hover:text-white gap-3 transition-all"
                    onClick={() => addToCart(product as any, quantity)}
                  >
                    <ShoppingCart size={20} /> Add to Cart
                  </Button>
                  <Button 
                    className="h-16 rounded-2xl font-black text-base uppercase shadow-xl shadow-primary/20 gap-3"
                    onClick={handleOrderNow}
                  >
                    Buy Now <Zap size={20} fill="currentColor" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck size={16} className="text-primary" /> Verified Product
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Truck size={16} className="text-primary" /> Express Shipping
                  </div>
                </div>
              </div>
            </div>

            {/* FULL WIDTH BOTTOM: Tabs */}
            <div className="lg:col-span-12 mt-6 md:mt-12">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="bg-white border p-1 h-14 rounded-2xl shadow-sm mb-6 md:mb-8 w-full md:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
                  <TabsTrigger value="description" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Product Description</TabsTrigger>
                  <TabsTrigger value="specs" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Technical Specs</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Reviews (12)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description">
                  <Card className="rounded-2xl md:rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 md:p-12 prose prose-slate max-w-none">
                      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg"><Info size={20} className="text-primary" /></div> Detailed Information
                      </h2>
                      <div className="text-gray-600 font-medium leading-loose whitespace-pre-wrap text-sm md:text-base">
                        {product.description}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="specs">
                  <Card className="rounded-2xl md:rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 md:p-12 space-y-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {[
                          { label: 'Category', val: product.categoryId || 'Supplies' },
                          { label: 'Brand', val: product.brand || 'Professional' },
                          { label: 'Size/Spec', val: product.size || 'Standard' },
                          { label: 'Availability', val: product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock' },
                        ].map((spec, i) => (
                          <div key={i} className="p-5 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-md">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{spec.label}</span>
                            <span className="text-sm font-bold text-gray-900">{spec.val}</span>
                          </div>
                        ))}
                        
                        {product.specifications?.map((spec: any, i: number) => (
                          <div key={`dynamic-${i}`} className="p-5 md:p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-md">
                            <span className="text-[9px] font-black uppercase text-primary tracking-widest">{spec.key}</span>
                            <span className="text-sm font-black text-gray-900">{spec.value || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card className="rounded-2xl md:rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-16 md:p-24 text-center flex flex-col items-center gap-4">
                      <div className="p-6 bg-gray-50 rounded-full text-muted-foreground/20"><Star size={64} /></div>
                      <div className="space-y-2">
                        <p className="text-lg font-black text-gray-900 uppercase">No Reviews Yet</p>
                        <p className="text-sm text-muted-foreground font-medium italic">Be the first to share your experience with this product!</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY FOOTER */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 px-4 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl flex gap-3">
          <Button 
            variant="outline"
            className="h-14 flex-1 rounded-xl font-black text-[11px] uppercase border-2 border-primary text-primary hover:bg-primary/5 gap-2"
            onClick={() => addToCart(product as any, quantity)}
          >
            <ShoppingCart size={18} /> Cart
          </Button>
          <Button 
            className="h-14 flex-[1.5] rounded-xl font-black text-[11px] uppercase shadow-xl shadow-primary/30 gap-2"
            onClick={handleOrderNow}
          >
            Buy Now <Zap size={18} fill="currentColor" />
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
