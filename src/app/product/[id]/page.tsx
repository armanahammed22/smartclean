
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Volume2, 
  Loader2, 
  ShoppingCart,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { generateProductSpeech } from '@/ai/flows/tts-flow';
import { useCart } from '@/components/providers/cart-provider';

export default function MobileProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { addToCart, setCheckoutOpen } = useCart();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const productRef = useMemoFirebase(() => db ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: product, isLoading } = useDoc(productRef);

  const handleSpeak = async () => {
    if (!product || isSpeaking) return;
    setIsSpeaking(true);
    try {
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => setIsSpeaking(false);
      } else {
        const text = `${product.name}. Price ${product.price} BDT. ${product.size ? `Size ${product.size}.` : ''} ${product.shortDescription || product.description}`;
        const url = await generateProductSpeech(text);
        setAudioUrl(url);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => setIsSpeaking(false);
      }
    } catch (e) {
      console.error("Speech error:", e);
      setIsSpeaking(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product);
    setCheckoutOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-white h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => router.push('/')}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-2xl relative rounded-none">
      {/* Simple Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-none">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-bold text-sm truncate">{product.name}</h1>
      </div>

      {/* Main View */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Product Image */}
        <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center rounded-none">
          <Image 
            src={product.imageUrl || 'https://picsum.photos/seed/product/800/800'} 
            alt={product.name || 'Product'} 
            fill 
            className="object-contain p-8"
            priority
          />
          <div className="absolute top-4 right-4">
            <Button 
              onClick={handleSpeak} 
              disabled={isSpeaking}
              variant="secondary" 
              className="rounded-none shadow-lg h-12 w-12 p-0 bg-white hover:bg-primary/10 text-primary border-none"
            >
              {isSpeaking ? <Loader2 className="animate-spin" size={24} /> : <Volume2 size={24} />}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-none px-3 py-1 rounded-none">
                {product.categoryId || 'General'}
              </Badge>
              <span className="text-[10px] font-black uppercase text-green-600">In Stock</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">৳{product.price.toLocaleString()}</span>
              {product.regularPrice > 0 && (
                <span className="text-sm text-gray-400 line-through">৳{product.regularPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Size Info */}
          {product.size && (
            <div className="p-4 bg-gray-50 rounded-none flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Available Size / Spec</span>
              <span className="text-sm font-bold text-gray-900">{product.size}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Description</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {product.description || product.shortDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-50">
            {product.brand && (
              <div className="flex justify-between py-2">
                <span className="text-[10px] font-black uppercase text-gray-400">Brand</span>
                <span className="text-xs font-bold">{product.brand}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-[10px] font-black uppercase text-gray-400">Delivery</span>
              <span className="text-xs font-bold">Standard 24-48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 flex gap-3 z-20">
        <Button 
          variant="outline" 
          className="flex-1 h-14 rounded-none font-black uppercase tracking-widest text-[10px] border-primary text-primary hover:bg-primary/5"
          onClick={() => addToCart(product)}
        >
          <ShoppingCart size={18} className="mr-2" /> Cart
        </Button>
        <Button 
          className="flex-[2] h-14 rounded-none font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
          onClick={handleBuyNow}
        >
          <Zap size={18} className="mr-2" /> Buy Now
        </Button>
      </div>
    </div>
  );
}
