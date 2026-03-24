'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
  LayoutGrid,
  ArrowRight,
  XCircle,
  AlertCircle
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(0);
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

  // 2. Fetch REAL-TIME Linked Product Data
  const productRef = useMemoFirebase(() => (db && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page?.productId]);
  const { data: linkedProduct, isLoading: productLoading } = useDoc(productRef);

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  // Stock Logic
  const currentStock = linkedProduct?.stockQuantity || 0;
  const isOutOfStock = currentStock <= 0;
  
  const currentCategory = page?.pricingCategories?.[activeCategory];
  const currentPackage = currentCategory?.packages?.[selectedPkgIndex];

  // Price Calculation: Prefer Landing Page Overrides, fallback to linked product data
  const price = currentPackage?.price || page?.discountPrice || page?.price || linkedProduct?.price || 0;
  const regularPrice = currentPackage?.originalPrice || page?.price || linkedProduct?.regularPrice || linkedProduct?.price || 0;
  const discountAmount = regularPrice > price ? regularPrice - price : 0;
  const deliveryCharge = 60;
  const subTotal = price * quantity;
  const totalPrice = subTotal + deliveryCharge;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "আপনার নাম, ফোন এবং ঠিকানা দিন।" });
      return;
    }

    if (isOutOfStock) {
      toast({ variant: "destructive", title: "Stock Out", description: "দুঃখিত, এই পণ্যটি এখন স্টকে নেই।" });
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
          name: page.type === 'service' ? (currentPackage ? `${currentCategory?.name} - ${currentPackage.name}` : page.title) : (linkedProduct?.name || page.title),
          price: price,
          quantity: quantity
        }],
        totalPrice: totalPrice,
        createdAt: new Date().toISOString(),
        riskLevel: 'Low',
        isSuspicious: false
      };

      const coll = page.type === 'service' ? 'bookings' : 'orders';
      await addDoc(collection(db, coll), orderData);
      
      // 3. AUTO STOCK MANAGEMENT: Reduce stock from database
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

  const scrollToForm = () => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });

  if (!mounted || isLoading || productLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
  if (!page || !page.active) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-body text-[#333] pb-24">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#8B0000] to-[#B22222] pt-10 pb-20 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl space-y-8 text-center relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none italic drop-shadow-xl">
              {page.heroTitle || linkedProduct?.name || page.title}
            </h1>
            <p className="text-white/80 text-sm md:text-xl font-medium max-w-2xl mx-auto">
              {page.heroSubtitle || page.subtitle || page.offer || linkedProduct?.shortDescription}
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/10 group">
            {page.useCustomBanner && page.bannerImage ? (
              <Image src={page.bannerImage} alt={page.title} fill className="object-cover" priority unoptimized />
            ) : page.videoUrl ? (
              <iframe src={`https://www.youtube.com/embed/${page.videoUrl.split('v=')[1] || page.videoUrl.split('/').pop()}`} className="w-full h-full" allowFullScreen />
            ) : (
              <Image src={linkedProduct?.imageUrl || page.imageUrl} alt={page.title} fill className="object-cover" priority unoptimized />
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button onClick={scrollToForm} disabled={isOutOfStock} className={cn("h-16 px-12 rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-xl uppercase shadow-xl w-full md:w-auto border-b-4 border-black/20", isOutOfStock && "grayscale opacity-50")}>
              {isOutOfStock ? "স্টক শেষ" : "🛒 অর্ডার করতে চাই"}
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-16 px-8 rounded-2xl border-none bg-black text-white hover:bg-gray-900 font-black text-lg uppercase gap-3 w-full md:w-auto" asChild>
                <a href={`tel:${page.phone}`}><Phone size={20} className="text-[#FFD700]" /> {page.phone}</a>
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldCheck size={14} className="text-[#FFD700]" /> 
            {isOutOfStock ? "বর্তমানে পণ্যটি স্টকে নেই" : (page.stockText || `মাত্র ${currentStock} টি পিস স্টকে আছে`)}
          </div>
        </div>
      </section>

      {/* 2. LIVE DATA DISPLAY */}
      <section className="py-12 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#081621]">লাইভ প্রোডাক্ট আপডেট</h2>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-[10px] font-black uppercase text-gray-400">স্টক অবস্থা</span>
                <Badge className={cn("border-none uppercase font-black text-[10px]", isOutOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                  {isOutOfStock ? "OUT OF STOCK" : "IN STOCK"}
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-[10px] font-black uppercase text-gray-400">বর্তমান মূল্য</span>
                <span className="text-2xl font-black text-red-600">৳{price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400">ডেলিভারি সময়</span>
                <span className="text-xs font-bold text-gray-700">২-৩ কার্যদিবস</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl text-center shadow-sm border border-gray-100">
              <Package size={32} className="mx-auto text-red-600 mb-2" />
              <p className="text-[10px] font-black uppercase text-gray-400">পণ্য ক্যাটাগরি</p>
              <p className="text-sm font-bold uppercase">{linkedProduct?.categoryId || 'সাধারন'}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl text-center shadow-sm border border-gray-100">
              <Star size={32} className="mx-auto text-amber-400 mb-2" fill="currentColor" />
              <p className="text-[10px] font-black uppercase text-gray-400">রেটিং</p>
              <p className="text-sm font-bold uppercase">৪.৯/৫</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ORDER / BOOKING SECTION */}
      <section id="order-section" className="py-20 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
          <div className="w-24 h-1.5 bg-[#8B0000] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:order-2 lg:sticky lg:top-24">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white border-t-[12px] border-[#8B0000]">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={linkedProduct?.imageUrl || page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-[#081621] uppercase text-xs leading-tight line-clamp-2">
                      {linkedProduct?.name || page.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 bg-gray-100 rounded-lg"><Minus size={14}/></button>
                      <span className="font-black text-lg">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-1 bg-gray-100 rounded-lg"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <span>ইউনিট প্রাইজ</span>
                    <span className="text-[#081621]">৳{price}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-blue-600">৳{deliveryCharge}</span>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-[#B22222] uppercase tracking-[0.3em] mb-2">সর্বমোট পেবল</p>
                      <p className="text-5xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice}</p>
                    </div>
                    <div className="bg-[#B22222]/10 text-[#B22222] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">BDT</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-[2rem] bg-[#59C1BD]/10 border border-[#59C1BD]/20 flex items-center gap-4 text-[#59C1BD] font-black uppercase tracking-widest text-[10px]">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><ShieldCheck size={24} /></div>
              Cash on Delivery Available
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-7 lg:order-1">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardContent className="p-8 md:p-12 space-y-10">
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">আপনার নাম</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="আপনার নাম লিখুন" 
                          className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ফোন নম্বর</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B0000]" size={20} />
                        <Input 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          placeholder="০১XXXXXXXXX" 
                          className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পূর্ণ ঠিকানা</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-[#8B0000]" size={20} />
                      <Textarea 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                        placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" 
                        className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white transition-all shadow-inner" 
                        required 
                      />
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center space-y-2">
                      <XCircle className="mx-auto text-red-600" size={32} />
                      <h3 className="font-black text-red-800 uppercase">Stock Out</h3>
                      <p className="text-xs font-bold text-red-700">দুঃখিত, এই মুহূর্তে পণ্যটি স্টকে নেই।</p>
                    </div>
                  ) : isSuccess ? (
                    <div className="p-10 bg-green-50 border border-green-100 rounded-[2rem] text-center space-y-2 animate-in zoom-in-95">
                      <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm"><CheckCircle2 className="text-green-600" size={48} /></div>
                      <h3 className="font-black text-green-800 uppercase text-xl mt-4">অর্ডার সফল হয়েছে!</h3>
                      <p className="text-xs font-bold text-green-700">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                    </div>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="w-full h-20 rounded-[2rem] bg-[#8B0000] hover:bg-[#B22222] text-white font-black text-2xl uppercase shadow-2xl active:scale-95 transition-all border-b-8 border-black/20">
                      {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : "অর্ডার সম্পন্ন করুন →"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#081621] text-white/40 text-center">
        <div className="container mx-auto px-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Copyright © 2026 Smart Clean Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] safe-area-pb">
        <Button onClick={scrollToForm} disabled={isOutOfStock} className="h-14 w-full rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-sm uppercase tracking-widest shadow-xl border-none">
          {isOutOfStock ? "স্টক শেষ" : <>অর্ডার করতে চাই <ArrowRight size={18} className="ml-2" /></>}
        </Button>
      </div>

    </div>
  );
}
