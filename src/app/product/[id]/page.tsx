"use client";

import React, { useState } from 'react';
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
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!product) return <div className="p-20 text-center font-bold text-muted-foreground">Product Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="hidden lg:flex mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all">
            <ArrowLeft size={18} /> Back to Catalog
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Side: Product Gallery */}
            <div className="lg:col-span-5 space-y-6">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white flex items-center justify-center group">
                {allImages.length > 0 ? (
                  <>
                    <Image 
                      src={allImages[activeImageIdx]} 
                      alt={product.name || 'Product Image'} 
                      fill 
                      className="object-contain p-8 md:p-12 transition-all duration-500" 
                      priority
                      unoptimized
                    />
                    {allImages.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-full shadow-lg h-10 w-10"
                          onClick={() => setActiveImageIdx(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        >
                          <ChevronLeft size={20} />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-full shadow-lg h-10 w-10"
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
                
                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                    {product.brand || 'Professional'}
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleSpeak} 
                  disabled={isSpeaking}
                  className="absolute bottom-6 right-6 rounded-full shadow-2xl h-14 w-14 p-0 bg-white hover:bg-primary hover:text-white text-primary border-none transition-all"
                >
                  {isSpeaking ? <Loader2 className="animate-spin" size={24} /> : <Volume2 size={24} />}
                </Button>
              </div>

              {/* Thumbnails Carousel */}
              {allImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={cn(
                        "relative w-20 h-20 rounded-2xl overflow-hidden border-4 transition-all shrink-0 bg-white",
                        activeImageIdx === idx ? "border-primary shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Product Actions */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{product.categoryId || 'General Supply'}</p>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">{product.name}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="flex items-center gap-1 text-amber-500"><Star size={16} fill="currentColor" /> 4.8</div>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16} /> In Stock ({product.stockQuantity})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-primary tracking-tighter">৳{product.price.toLocaleString()}</span>
                    {product.regularPrice > product.price && (
                      <span className="text-lg text-muted-foreground line-through decoration-red-200">৳{product.regularPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium italic">Standard local taxes and shipping rates apply at checkout.</p>
                </div>

                {/* Delivery Information Box */}
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    <Truck size={16} /> Delivery Information
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {deliveryOptions?.map(opt => (
                      <div key={opt.id} className="bg-white px-3 py-2 rounded-xl border border-blue-50 flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">{opt.label}</span>
                        <span className="text-xs font-black text-blue-700">৳{opt.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Quantity</span>
                    <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></Button>
                      <span className="w-10 text-center font-black text-sm">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Spec/Size</span>
                    <Badge variant="outline" className="h-8 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest">{product.size || 'Standard Unit'}</Badge>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    className="h-16 rounded-2xl font-black text-base uppercase border-2 border-primary text-primary hover:bg-primary/5 gap-2"
                    onClick={() => addToCart(product as any, quantity)}
                  >
                    <ShoppingCart size={20} /> Add to Cart
                  </Button>
                  <Button 
                    className="h-16 rounded-2xl font-black text-base uppercase shadow-xl shadow-primary/20 gap-2"
                    onClick={handleOrderNow}
                  >
                    Order Now <Zap size={20} fill="currentColor" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck size={16} className="text-primary" /> 1 Year Warranty
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Package size={16} className="text-primary" /> Fast Delivery
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Content: Detailed Info */}
            <div className="lg:col-span-12 mt-12">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="bg-white border p-1 h-14 rounded-2xl shadow-sm mb-8 w-full md:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
                  <TabsTrigger value="description" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Full Description</TabsTrigger>
                  <TabsTrigger value="specs" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Extra Specifications</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-xl px-8 h-full font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Reviews (12)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description">
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-10 prose prose-slate max-w-none">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-2">
                        <Info className="text-primary" /> Detailed Overview
                      </h2>
                      <div className="text-gray-600 font-medium leading-loose whitespace-pre-wrap">
                        {product.description}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="specs">
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-10 space-y-10">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between border-b pb-4 border-gray-100">
                          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
                            <Settings2 className="text-primary" size={28} /> Product Specifications
                          </h2>
                          <Badge variant="secondary" className="uppercase font-black text-[9px] px-3 tracking-widest">Technical Data</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[
                            { label: 'Brand Name', val: product.brand || 'Smart Clean Pro' },
                            { label: 'Product Model', val: product.id.slice(0, 8).toUpperCase() },
                            { label: 'Main Category', val: product.categoryId || 'Cleaning Equipment' },
                            { label: 'Standard Unit', val: product.size || 'N/A' },
                            { label: 'Inventory Status', val: product.stockQuantity > 0 ? 'In Stock' : 'Pre-Order' },
                          ].map((spec, i) => (
                            <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1.5 transition-all hover:bg-white hover:shadow-md">
                              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{spec.label}</span>
                              <span className="text-sm font-bold text-gray-900">{spec.val}</span>
                            </div>
                          ))}
                          
                          {product.specifications?.map((spec: any, i: number) => (
                            <div key={`dynamic-${i}`} className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col gap-1.5 transition-all hover:bg-white hover:shadow-md animate-in fade-in">
                              <span className="text-[9px] font-black uppercase text-primary tracking-widest">{spec.key}</span>
                              <span className="text-sm font-black text-gray-900">{spec.value || 'N/A'}</span>
                            </div>
                          ))}
                        </div>

                        {(!product.specifications || product.specifications.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                            <Box size={40} className="text-gray-300" />
                            <p className="text-sm font-medium text-gray-400 italic">No extra technical data provided for this item.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-20 text-center flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-50 rounded-full text-muted-foreground/30"><Star size={48} /></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 uppercase tracking-tight">Reviews Coming Soon</p>
                        <p className="text-sm font-medium text-muted-foreground italic">Be the first to review this product after your purchase!</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 px-6 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem] flex gap-3">
          <Button 
            variant="outline"
            className="h-14 flex-1 rounded-2xl font-black text-[10px] uppercase border-2 border-primary text-primary hover:bg-primary/5 gap-2"
            onClick={() => addToCart(product as any, quantity)}
          >
            <ShoppingCart size={16} /> Cart
          </Button>
          <Button 
            className="h-14 flex-[1.5] rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-primary/30 gap-2"
            onClick={handleOrderNow}
          >
            Order Now <Zap size={16} fill="currentColor" />
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}