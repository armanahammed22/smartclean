
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Volume2, 
  Loader2, 
  Zap,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { generateProductSpeech } from '@/ai/flows/tts-flow';

export default function MinimalistMobileProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  
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
        const text = `${product.name}. Size ${product.size || 'standard'}. Price ${product.price} BDT.`;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-full">Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative">
      {/* Floating Back Button */}
      <button 
        onClick={() => router.back()} 
        className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-gray-100"
      >
        <ArrowLeft size={20} className="text-gray-900" />
      </button>

      {/* Main Image View */}
      <div className="relative aspect-[4/5] w-full bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
        <Image 
          src={product.imageUrl || 'https://picsum.photos/seed/product/800/1000'} 
          alt={product.name || 'Product'} 
          fill 
          className="object-contain p-12"
          priority
        />
        
        {/* Voice Trigger */}
        <div className="absolute bottom-6 right-6">
          <Button 
            onClick={handleSpeak} 
            disabled={isSpeaking}
            className="rounded-full shadow-2xl h-14 w-14 p-0 bg-white hover:bg-gray-50 text-primary border-none"
          >
            {isSpeaking ? <Loader2 className="animate-spin" size={28} /> : <Volume2 size={28} />}
          </Button>
        </div>
      </div>

      {/* Minimal Content Section */}
      <div className="flex-1 p-8 space-y-10">
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-primary">৳{product.price.toLocaleString()}</span>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-500">
              <Box size={16} />
              <span className="text-xs font-black uppercase tracking-widest">{product.size || 'STANDARD'}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-6">
          <Button 
            className="w-full h-16 rounded-full font-black text-lg shadow-2xl shadow-primary/30 gap-3 uppercase tracking-tight"
            onClick={() => router.push('/cart')}
          >
            <Zap size={20} fill="currentColor" />
            Continue to Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
