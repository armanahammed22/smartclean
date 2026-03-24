'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  Phone, 
  ShoppingCart, 
  Package, 
  MapPin, 
  User, 
  Loader2,
  ShieldCheck,
  Zap,
  Star,
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  XCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page Config
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Linked Product Data
  const productRef = useMemoFirebase(() => (db && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page?.productId]);
  const { data: linkedProduct, isLoading: productLoading } = useDoc(productRef);

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  // Pricing Logic
  const currentPackages = page?.pricingCategories?.[0]?.packages || page?.packages || [];
  const selectedPackage = currentPackages[selectedPkgIndex];

  const price = selectedPackage?.price || page?.discountPrice || page?.price || linkedProduct?.price || 0;
  const regularPrice = selectedPackage?.originalPrice || page?.price || linkedProduct?.regularPrice || linkedProduct?.price || 0;
  const deliveryCharge = 60;
  const subTotal = price * quantity;
  const totalPrice = subTotal + deliveryCharge;

  const currentStock = linkedProduct?.stockQuantity || 0;
  const isOutOfStock = currentStock <= 0;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "আপনার নাম, ফোন এবং ঠিকানা দিন।" });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        status: 'New',
        source: page.slug,
        productId: page.productId || null,
        items: [{
          id: page.productId || page.id,
          name: page.title + (selectedPackage ? ` (${selectedPackage.name})` : ''),
          price: price,
          quantity: quantity
        }],
        totalPrice: totalPrice,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      if (page.productId) {
        await updateDoc(doc(db, 'products', page.productId), {
          stockQuantity: increment(-quantity)
        });
      }

      trackEvent('Purchase', { value: totalPrice, currency: 'BDT', content_name: page.title });
      setIsSuccess(true);
      
      const waMsg = `আসসালামু আলাইকুম, আমি ${orderData.items[0].name} অর্ডার করতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nপরিমাণ: ${quantity}\nটোটাল: ৳${totalPrice}`;
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      setTimeout(() => router.push('/order-success?id=success'), 2000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "অর্ডার সম্পন্ন করা যায়নি।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });

  if (!mounted || isLoading || productLoading) return <div className="h-screen flex items-center justify-center bg-[#8B0000]"><Loader2 className="animate-spin text-white" size={40} /></div>;
  if (!page) return null;

  return (
    <div className="bg-white min-h-screen font-body text-[#333]">
      
      {/* 1. HERO SECTION (Dark Red Gradient) */}
      <section className="bg-gradient-to-b from-[#8B0000] to-[#5D0000] pt-8 pb-12 px-4 text-center">
        <div className="container mx-auto max-w-4xl space-y-6">
          <h1 className="text-xl md:text-3xl font-black text-[#FFD700] uppercase tracking-tight leading-tight">
            {page.heroTitle || page.title}
          </h1>
          <p className="text-white text-xs md:text-base font-bold opacity-90">
            {page.heroSubtitle || page.subtitle || page.offer}
          </p>

          <div className="relative mx-auto max-w-md aspect-square bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
              <Image 
                src={linkedProduct?.imageUrl || page.imageUrl || 'https://picsum.photos/seed/product/600/600'} 
                alt={page.title} 
                fill 
                className="object-contain p-4" 
                priority 
                unoptimized 
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <Button 
              onClick={scrollToForm} 
              className="h-14 px-10 rounded-lg bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-lg uppercase shadow-xl w-full max-w-xs gap-2"
            >
              <ShoppingCart size={20} /> অর্ডার করতে চাই
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-12 px-8 rounded-lg bg-black text-white hover:bg-gray-900 border-none font-bold gap-3 w-full max-w-xs" asChild>
                <a href={`tel:${page.phone}`}><Phone size={18} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 2. INGREDIENTS SECTION (Dynamic Grid) */}
      {page.floatingServices && page.floatingServices.length > 0 && (
        <section className="py-12 bg-gray-50 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-xl font-black text-[#8B0000] text-center mb-10 uppercase">যে সকল উপাদানে তৈরি?</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {page.floatingServices.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-gray-600 text-center uppercase tracking-tighter">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Button onClick={scrollToForm} className="bg-[#FFD700] hover:bg-[#FFC800] text-black font-black uppercase text-xs px-8 h-10 rounded-lg shadow-lg">অর্ডার করতে চাই</Button>
            </div>
          </div>
        </section>
      )}

      {/* 3. USAGE SECTION (Red Title Bar + Split Layout) */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#8B0000] text-white p-3 rounded-lg text-center mb-10">
            <h2 className="font-black text-sm md:text-lg uppercase tracking-tight">যেভাবে আপনি মজাদার বালাচাও খেতে পারেনঃ</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {page.includingItems?.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1 bg-red-100 text-red-600 rounded-full mt-0.5"><Check size={14} strokeWidth={4} /></div>
                  <p className="text-xs md:text-sm font-bold text-gray-700 leading-relaxed">{item.title}</p>
                </div>
              ))}
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-gray-100 shadow-xl">
              <Image src={page.bannerImage || page.imageUrl} alt="Usage" fill className="object-cover" unoptimized />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-12">
            <Button onClick={scrollToForm} className="bg-[#FFD700] hover:bg-[#FFC800] text-black font-black uppercase text-xs px-8 h-10 rounded-lg">অর্ডার করতে চাই</Button>
            {page.phone && (
              <Button variant="outline" className="bg-black text-white border-none h-10 px-6 rounded-lg text-xs font-bold gap-2" asChild>
                <a href={`tel:${page.phone}`}><Phone size={14} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 4. TRUST SECTION (Benefit List) */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-2xl bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
          <div className="bg-[#8B0000] text-white p-3 rounded-lg text-center mb-8">
            <h2 className="font-black text-sm md:text-lg uppercase tracking-tight">আমাদের উপর কেন আস্থা রাখবেন?</h2>
          </div>
          <div className="space-y-4">
            {page.detailsContent?.features?.map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0">
                <CheckCircle2 size={18} className="text-[#8B0000] shrink-0" />
                <p className="text-xs md:text-sm font-bold text-gray-700 leading-snug">{f.title}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3 mt-10">
            <Button onClick={scrollToForm} className="bg-[#FFD700] hover:bg-[#FFC800] text-black font-black uppercase text-xs px-8 h-10 rounded-lg">অর্ডার করতে চাই</Button>
            {page.phone && (
              <Button variant="outline" className="bg-black text-white border-none h-10 px-6 rounded-lg text-xs font-bold gap-2" asChild>
                <a href={`tel:${page.phone}`}><Phone size={14} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 5. STORAGE INFO (Green Box) */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-xl border-2 border-green-600 p-6 rounded-2xl bg-green-50/30 text-center">
          <h2 className="font-black text-red-700 text-lg uppercase mb-4 underline">যেভাবে সংরক্ষণ করবেনঃ</h2>
          <p className="text-xs md:text-sm font-bold text-gray-700 leading-loose">
            {page.stockText || "কাঁচের বয়ামে রাখলে বালাচাও ক্রিস্পি থাকে প্রায় অনেক দিন। তবে প্লাস্টিকের বয়ামে রাখলে এর ফ্লেভার এবং টেক্সচার নষ্ট হতে পারে। সব সময় এয়ার টাইট বক্সে রাখার চেষ্টা করবেন।"}
          </p>
        </div>
      </section>

      {/* 6. PRICING SECTION (Red Gradient Box) */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl bg-gradient-to-r from-[#8B0000] to-[#B22222] p-8 rounded-3xl text-white text-center shadow-2xl space-y-6">
          <div className="space-y-4">
            {currentPackages.map((pkg: any, i: number) => (
              <div 
                key={i} 
                onClick={() => setSelectedPkgIndex(i)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer",
                  selectedPkgIndex === i ? "bg-white/20 border-[#FFD700]" : "bg-black/10 border-white/10"
                )}
              >
                <p className="text-sm md:text-xl font-black uppercase">
                  {pkg.name} = <span className="text-[#FFD700]">৳{pkg.price} টাকা</span>
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <Button onClick={scrollToForm} className="bg-[#FFD700] hover:bg-[#FFC800] text-black font-black uppercase text-sm px-10 h-12 rounded-lg">অর্ডার করতে চাই</Button>
            {page.phone && (
              <Button variant="outline" className="bg-black text-white border-none h-10 px-6 rounded-lg text-xs font-bold gap-2" asChild>
                <a href={`tel:${page.phone}`}><Phone size={14} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FFD700] flex items-center justify-center gap-2">
            <Zap size={12} fill="currentColor" /> ফ্রী হোম ডেলিভারি সারা দেশেই পাওয়া যাচ্ছে
          </p>
        </div>
      </section>

      {/* 7. ORDER FORM SECTION */}
      <section id="order-form" className="py-20 px-4 container mx-auto max-w-6xl">
        <div className="bg-[#8B0000] text-white p-4 rounded-t-[2rem] text-center max-w-2xl mx-auto">
          <h2 className="font-black text-sm md:text-lg uppercase">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-0">
          <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-b-[2.5rem] rounded-tl-[2.5rem] shadow-2xl border-t-4 border-[#8B0000]">
            <form onSubmit={handleOrderSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার নাম</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="নাম লিখুন" 
                      className="h-14 pl-12 bg-gray-50 border-none rounded-xl font-bold text-lg" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ফোন নম্বর</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="০১XXXXXXXXX" 
                      className="h-14 pl-12 bg-gray-50 border-none rounded-xl font-bold text-lg" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">পূর্ণ ঠিকানা</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-[#8B0000]" size={20} />
                  <Textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="আপনার বিস্তারিত ঠিকানা দিন" 
                    className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-xl font-bold text-lg" 
                    required 
                  />
                </div>
              </div>

              {isSuccess ? (
                <div className="p-8 bg-green-50 rounded-2xl text-center border-2 border-green-100">
                  <CheckCircle2 className="text-green-600 mx-auto mb-4" size={48} />
                  <h3 className="font-black text-green-800 text-xl uppercase">অর্ডার সফল হয়েছে!</h3>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isOutOfStock} 
                  className="w-full h-16 rounded-xl bg-[#8B0000] hover:bg-[#B22222] text-white font-black text-xl uppercase shadow-2xl"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "অর্ডার সম্পন্ন করুন →"}
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-[12px] border-[#8B0000]">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={linkedProduct?.imageUrl || page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-gray-900 uppercase text-xs leading-tight line-clamp-2">
                      {page.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 bg-gray-100 rounded-lg"><Minus size={14}/></button>
                      <span className="font-black text-lg">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-1 bg-gray-100 rounded-lg"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>প্রোডাক্ট প্রাইজ</span>
                    <span className="text-gray-900 font-black">৳{price}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-blue-600 font-black">৳{deliveryCharge}</span>
                  </div>
                  <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest mb-1">মোট টাকা</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">৳{totalPrice}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] px-3">CASH ON DELIVERY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <Button onClick={scrollToForm} className="h-14 w-full rounded-xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-sm uppercase tracking-widest shadow-xl">
          অর্ডার করতে চাই <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>

    </div>
  );
}
