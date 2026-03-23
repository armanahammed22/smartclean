
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, addDoc } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  CheckCircle2, 
  Star, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Loader2,
  Award,
  Timer,
  Phone,
  MessageCircle,
  ShoppingCart,
  Package,
  Info,
  MapPin,
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  useEffect(() => {
    if (page && mounted) {
      trackEvent('ViewContent', {
        content_name: page.title,
        content_category: 'Product Landing Page'
      });
      // Set default package if available
      if (page.packages?.length > 0) {
        setSelectedPackage(page.packages[0]);
      }
    }
  }, [page, mounted]);

  const handleScrollToForm = () => {
    const form = document.getElementById('order-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "অনুগ্রহ করে আপনার নাম, ফোন নম্বর এবং ঠিকানা দিন।" });
      return;
    }

    setIsOrdering(true);
    const totalPrice = selectedPackage ? selectedPackage.discountPrice : (page.discountPrice || page.price);

    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        items: [{
          id: page.id,
          name: page.title + (selectedPackage ? ` (${selectedPackage.name})` : ''),
          price: totalPrice,
          quantity: 1
        }],
        totalPrice: totalPrice + 60, // Assuming 60 BDT delivery
        status: 'New',
        source: page.slug,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      trackEvent('Purchase', {
        content_name: page.title,
        value: totalPrice,
        currency: 'BDT'
      });

      toast({ title: "অর্ডার সফল হয়েছে!", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।" });
      router.push(`/order-success?id=success&type=order`);
    } catch (error) {
      toast({ variant: "destructive", title: "দুঃখিত", description: "অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।" });
    } finally {
      setIsOrdering(false);
    }
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-red-600" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Experience...</p>
    </div>
  );

  if (!page || !page.active) return null;

  const currentPrice = selectedPackage ? selectedPackage.discountPrice : (page.discountPrice || page.price);
  const originalPrice = selectedPackage ? selectedPackage.price : page.price;

  return (
    <div className="bg-[#FDFDFD] min-h-screen font-body text-[#333]">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#D91E1E] to-[#B21818] text-white pt-10 pb-20 overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10 space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight uppercase">
              {page.title}
            </h1>
            <p className="text-lg md:text-2xl font-bold text-yellow-400">
              {page.subtitle}
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/20 group">
            {page.videoUrl ? (
              <iframe 
                src={`https://www.youtube.com/embed/${page.videoUrl.split('v=')[1] || page.videoUrl.split('/').pop()}`}
                className="w-full h-full"
                title="Product Video"
                allowFullScreen
              />
            ) : page.imageUrl ? (
              <Image src={page.imageUrl} alt={page.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20"><Package size={100} /></div>
            )}
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleScrollToForm}
                className="h-16 px-12 rounded-full bg-[#FFD700] hover:bg-[#FFC400] text-black font-black text-xl uppercase tracking-tight shadow-2xl animate-pulse active:scale-95 transition-all"
              >
                অর্ডার করতে চাই <ArrowRight size={24} className="ml-2" />
              </Button>
              {page.phone && (
                <Button 
                  variant="outline"
                  className="h-16 px-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-red-600 font-black text-lg uppercase gap-2"
                  asChild
                >
                  <a href={`tel:${page.phone}`}><Phone size={24} /> কল করুন</a>
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest bg-black/20 w-fit mx-auto px-6 py-2 rounded-full border border-white/10">
              <Zap size={16} className="text-yellow-400" fill="currentColor" /> {page.stockText || 'মাত্র ১২ টি বাকি'}
            </div>
          </div>
        </div>

        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-full fill-[#FDFDFD]">
            <path d="M0,160L48,176C96,192,192,208,288,213.3C384,219,480,213,576,186.7C672,160,768,112,864,112C960,112,1056,160,1152,181.3C1248,203,1344,197,1392,194.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* 2. INGREDIENTS SECTION */}
      {page.ingredients && page.ingredients.length > 0 && (
        <section className="py-20 container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-[#D91E1E] uppercase tracking-tighter">মূল উপাদান সমূহ</h2>
            <div className="w-20 h-1.5 bg-yellow-400 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {page.ingredients.map((ing, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-500">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-red-50 p-1 group-hover:border-red-500 transition-colors">
                  <Image src={ing.imageUrl || 'https://picsum.photos/seed/ing/200/200'} alt={ing.name} fill className="object-cover rounded-full" unoptimized />
                </div>
                <span className="text-lg font-black text-gray-800 uppercase tracking-tight">{ing.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. BENEFITS SECTION */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase leading-tight">
                কেন এটি আপনার জন্য <span className="text-red-600">সেরা?</span>
              </h2>
              <div className="space-y-4">
                {page.benefits?.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 group hover:border-red-500 transition-all">
                    <div className="p-1 bg-red-100 text-red-600 rounded-full shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-lg font-bold text-gray-700 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square order-1 lg:order-2 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
              <Image src={page.imageUrl} alt="Benefits" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      {page.whyChoose && page.whyChoose.length > 0 && (
        <section className="py-20 container mx-auto px-4 max-w-4xl">
          <div className="p-10 md:p-16 rounded-[3rem] border-4 border-red-600 bg-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-red-600 -rotate-12"><Award size={150} /></div>
            <div className="relative z-10 space-y-10">
              <h2 className="text-3xl md:text-5xl font-black text-red-600 uppercase text-center tracking-tighter">কেন আমাদের থেকে নিবেন?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {page.whyChoose.map((point, i) => (
                  <div key={i} className="flex items-center gap-4 text-lg font-black text-gray-800">
                    <div className="w-3 h-3 bg-red-600 rounded-full shrink-0 shadow-lg shadow-red-600/40" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. PRICING SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-[#D91E1E] uppercase tracking-tighter">সেরা অফারে অর্ডার করুন</h2>
            <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">{page.offerText || 'সীমিত সময়ের জন্য অফার'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {page.packages && page.packages.length > 0 ? (
              page.packages.map((pkg, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "p-8 rounded-[3rem] border-4 transition-all cursor-pointer relative group",
                    selectedPackage?.name === pkg.name ? "bg-gradient-to-br from-red-600 to-red-700 text-white border-yellow-400 scale-105 shadow-2xl" : "bg-white border-gray-100 text-gray-900 hover:border-red-200 shadow-xl"
                  )}
                >
                  <div className="space-y-6 text-center">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{pkg.name}</h3>
                    <div className="space-y-1">
                      <p className={cn("text-lg font-bold line-through opacity-60", selectedPackage?.name === pkg.name ? "text-white" : "text-gray-400")}>৳{pkg.price}</p>
                      <p className={cn("text-5xl font-black tracking-tighter", selectedPackage?.name === pkg.name ? "text-yellow-400" : "text-red-600")}>৳{pkg.discountPrice}</p>
                    </div>
                    <div className={cn("inline-flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest", selectedPackage?.name === pkg.name ? "bg-white text-red-600" : "bg-red-600 text-white")}>
                      {selectedPackage?.name === pkg.name ? <CheckCircle2 size={16} /> : <Zap size={16} fill="currentColor" />} {selectedPackage?.name === pkg.name ? 'নির্বাচিত' : 'অর্ডার করুন'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full mx-auto w-full max-w-lg p-10 rounded-[3rem] bg-gradient-to-br from-red-600 to-red-700 text-white border-4 border-yellow-400 text-center space-y-6 shadow-2xl">
                <h3 className="text-2xl font-black uppercase tracking-tight">স্পেশাল প্যাকেজ</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold line-through opacity-60 text-white">৳{page.price}</p>
                  <p className="text-6xl font-black tracking-tighter text-yellow-400">৳{page.discountPrice || page.price}</p>
                </div>
                <Button onClick={handleScrollToForm} className="h-14 w-full rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-black text-lg uppercase shadow-xl active:scale-95 transition-all">
                  অর্ডার করতে চাই <ShoppingCart size={20} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. ORDER FORM SECTION */}
      <section id="order-form" className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Form Left */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-[#D91E1E] uppercase tracking-tighter leading-none">অর্ডার কনফার্ম করুন</h2>
              <p className="text-lg font-bold text-gray-500">সঠিক তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন</p>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-6 bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার নাম</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={20} />
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="নাম লিখুন" 
                    className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-all" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ফোন নম্বর</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={20} />
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="ফোন নম্বর লিখুন" 
                    className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-all" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">পূর্ণ ঠিকানা</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-red-600" size={20} />
                  <Textarea 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" 
                    className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-all" 
                    required
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-4 text-green-700 font-black uppercase tracking-widest text-sm">
                <div className="p-3 bg-white rounded-xl shadow-sm text-green-600"><ShieldCheck size={24} /></div>
                পেমেন্ট: ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিন)
              </div>

              <Button 
                type="submit" 
                disabled={isOrdering}
                className="w-full h-20 rounded-[2rem] bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase tracking-tight shadow-2xl shadow-red-600/20 active:scale-95 transition-all"
              >
                {isOrdering ? <Loader2 className="animate-spin" size={32} /> : "অর্ডার সম্পন্ন করুন"}
              </Button>
            </form>
          </div>

          {/* Checkout Right */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center justify-between">
                  অর্ডার ডিটেইলস
                  <ShoppingCart size={24} className="text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-gray-900 uppercase text-sm leading-tight line-clamp-2">{page.title}</h4>
                    {selectedPackage && <Badge className="bg-red-50 text-red-600 border-none uppercase font-black text-[9px]">{selectedPackage.name}</Badge>}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                    <span>পণ্যের মূল্য</span>
                    <span className="text-gray-900">৳{currentPrice}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-red-600">৳৬০</span>
                  </div>
                  <div className="pt-6 border-t-2 border-red-600/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1">সর্বমোট</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">৳{currentPrice + 60}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] px-3 py-1 rounded-full">৳ সঞ্চয়: {originalPrice - currentPrice}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-[2rem] bg-yellow-50 border-2 border-yellow-200 space-y-4">
              <div className="flex items-center gap-3">
                <Info size={24} className="text-yellow-600" />
                <h4 className="font-black uppercase text-sm tracking-tight">ডেলিভারি সংক্রান্ত</h4>
              </div>
              <p className="text-sm font-medium text-yellow-800 leading-relaxed">
                ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩-৫ দিনের মধ্যে ডেলিভারি সম্পন্ন করা হয়। পণ্য পছন্দ না হলে ফেরত দেওয়ার সুযোগ রয়েছে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#081621] text-white/40 text-center">
        <div className="container mx-auto px-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Copyright © 2026 Smart Clean. All rights reserved.</p>
        </div>
      </footer>

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-50">
        {page.phone && (
          <a href={`tel:${page.phone}`} className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <Phone size={24} />
          </a>
        )}
        <a href={`https://wa.me/8801919640422`} target="_blank" className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
          <MessageCircle size={28} fill="currentColor" className="text-white" />
        </a>
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest line-through">৳{originalPrice}</p>
            <p className="text-2xl font-black text-red-600 tracking-tighter leading-none">৳{currentPrice}</p>
          </div>
          <Button onClick={handleScrollToForm} className="h-14 flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-xl">
            অর্ডার করতে চাই <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>

    </div>
  );
}
