
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
  TrendingUp,
  ArrowRight,
  XCircle,
  Zap,
  Star,
  Award
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
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Linked Product
  const productRef = useMemoFirebase(() => (db && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page?.productId]);
  const { data: linkedProduct } = useDoc(productRef);

  // 3. Fetch Best Selling
  const bestSellingQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'products'), where('isBestSelling', '==', true), limit(8)) : null, [db]);
  const { data: bestSelling } = useCollection(bestSellingQuery);

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  const isOutOfStock = linkedProduct && (linkedProduct.stockQuantity <= 0);
  const price = page?.discountPrice || page?.price || linkedProduct?.price || 0;
  const regularPrice = page?.price || linkedProduct?.regularPrice || linkedProduct?.price || 0;
  const discountAmount = regularPrice > price ? regularPrice - price : 0;
  const deliveryCharge = 60;
  const totalPrice = price + deliveryCharge;

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
        status: 'New',
        source: page.slug,
        items: [{
          id: page.productId || page.id,
          name: page.title,
          price: price,
          quantity: 1
        }],
        totalPrice: totalPrice,
        createdAt: new Date().toISOString(),
        riskLevel: 'Low',
        isSuspicious: false
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      if (page.productId) {
        await updateDoc(doc(db, 'products', page.productId), {
          stockQuantity: increment(-1)
        });
      }

      trackEvent('Purchase', { value: totalPrice, currency: 'BDT', content_name: page.title });
      setIsSuccess(true);
      
      const waMsg = `আসসালামু আলাইকুম, আমি ${page.title} অর্ডার করতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nটোটাল: ৳${totalPrice}`;
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      setTimeout(() => router.push('/order-success?id=success'), 2000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "অর্ডার সম্পন্ন করা যায়নি।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });

  if (!mounted || isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
  if (!page || !page.active) return null;

  return (
    <div className="bg-white min-h-screen font-body text-[#333]">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#D60000] to-[#A30000] pt-10 pb-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-8 text-center">
          <div className="relative mx-auto max-w-3xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/10">
            {page.useCustomBanner && page.bannerImage ? (
              <Image src={page.bannerImage} alt={page.title} fill className="object-cover" priority unoptimized />
            ) : page.videoUrl ? (
              <iframe src={`https://www.youtube.com/embed/${page.videoUrl.split('v=')[1] || page.videoUrl.split('/').pop()}`} className="w-full h-full" allowFullScreen />
            ) : (
              <Image src={page.imageUrl} alt={page.title} fill className="object-cover" priority unoptimized />
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button onClick={scrollToForm} className="h-14 px-10 rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-xl uppercase shadow-xl animate-pulse w-full md:w-auto">
              🛒 অর্ডার করতে চাই
            </Button>
            {page.phone && (
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-none bg-black text-white hover:bg-gray-900 font-black text-lg uppercase gap-2 w-full md:w-auto" asChild>
                <a href={`tel:${page.phone}`}><Phone size={20} /> {page.phone}</a>
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-[#FFD700]" /> {page.stockText || 'অফারটি সীমিত সময়ের জন্য'}
          </div>
        </div>
      </section>

      {/* CURVED DIVIDER */}
      <div className="-mt-12 relative z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="fill-white w-full h-auto"><path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path></svg>
      </div>

      {/* 2. BEST SELLING */}
      {bestSelling && bestSelling.length > 0 && (
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-red-600" size={20} />
              <h2 className="text-lg font-black uppercase text-[#081621]">যে সকল পণ্যগুলো বেশি বিক্রি হচ্ছে</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
              {bestSelling.map((prod) => (
                <Link key={prod.id} href={`/product/${prod.id}`} className="min-w-[140px] md:min-w-[160px] group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition-all">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50">
                      <Image src={prod.imageUrl} alt={prod.name} fill className="object-contain p-2" unoptimized />
                    </div>
                    <h4 className="text-[10px] font-bold text-center line-clamp-2 uppercase leading-tight group-hover:text-red-600">{prod.name}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BUTTON */}
      <div className="container mx-auto px-4 py-6 text-center">
        <Button onClick={scrollToForm} className="h-14 px-12 rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-xl uppercase shadow-lg w-full max-w-md">
          🛒 অর্ডার করতে চাই
        </Button>
      </div>

      {/* 3. WHY BEST SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase">কেন এটি আপনার জন্য <span className="text-red-600">সেরা?</span></h2>
              <div className="space-y-4">
                {(page.benefits || ['উন্নত মানের উপাদান', 'সাশ্রয়ী মূল্য', 'দ্রুত ডেলিভারি']).map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                    <div className="p-1 rounded-full bg-red-50 text-red-600 shrink-0"><CheckCircle2 size={20} /></div>
                    <p className="text-base font-bold text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square order-1 lg:order-2 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
              <Image src={page.imageUrl} alt="Why Best" fill className="object-cover" unoptimized />
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETAILS / CHOOSE US SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-br from-[#D60000] to-[#A30000] rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Award size={200} /></div>
            <div className="relative z-10 space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">বিস্তারিত</h2>
                <div className="w-20 h-1.5 bg-[#FFD700] mx-auto rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(page.whyChoose || ['১০০% ন্যাচারাল', 'কোনো পার্শ্বপ্রতিক্রিয়া নেই', 'বিএসটিআই অনুমোদিত']).map((item: string, i: number) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <div className="p-3 bg-[#FFD700] text-black rounded-full shadow-lg"><CheckCircle2 size={24} /></div>
                    <span className="font-bold text-sm uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>

              {/* Extra product snippets if any */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                <div className="bg-white p-3 rounded-2xl flex items-center gap-4 text-black shadow-xl">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                    <Image src={page.imageUrl} alt="Mini" fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{page.title}</p>
                    <p className="text-sm font-black text-red-600 leading-none">৳{price}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BUTTON AGAIN */}
      <div className="container mx-auto px-4 py-10 text-center">
        <Button onClick={scrollToForm} className="h-14 px-12 rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-xl uppercase shadow-lg w-full max-w-md">
          🛒 অর্ডার করতে চাই
        </Button>
      </div>

      {/* 5. ORDER SECTION */}
      <section id="order-section" className="py-20 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
          <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Order Summary (First on Mobile) */}
          <div className="lg:col-span-5 space-y-6 lg:order-2 lg:sticky lg:top-24">
            <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white">
              <div className="bg-gray-50 p-6 border-b flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-sm text-gray-500">অর্ডার সামারি</h3>
                <ShoppingCart className="text-red-600" size={20} />
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-gray-900 uppercase text-xs leading-tight line-clamp-2">{page.title}</h4>
                    <Badge className="bg-red-50 text-red-600 border-none uppercase font-black text-[9px]">Quantity: 1</Badge>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>পণ্যের মূল্য</span>
                    <span className="text-gray-900">৳{regularPrice}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>অতিরিক্ত</span>
                    <span className="text-gray-900">৳০</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs font-black text-red-600 uppercase tracking-widest">
                      <span>ডিসকাউন্ট 🔥</span>
                      <span>- ৳{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-red-600">৳{deliveryCharge}</span>
                  </div>

                  <div className="pt-6 border-t-2 border-red-600/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">সর্বমোট পেবল</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">৳{totalPrice}</p>
                    </div>
                    <div className="bg-red-100 text-red-700 text-[9px] font-black px-3 py-1 rounded-full uppercase">BDT</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center gap-4 text-yellow-800 font-black uppercase tracking-widest text-[10px]">
              <ShieldCheck size={24} className="text-yellow-600" />
              Cash on Delivery Available
            </div>
          </div>

          {/* Form Card (Desktop Left) */}
          <div className="lg:col-span-7 lg:order-1">
            <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white">
              <CardContent className="p-8 md:p-12 space-y-8">
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">আপনার নাম</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={20} />
                      <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="নাম লিখুন" 
                        className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ফোন নম্বর</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={20} />
                      <Input 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        placeholder="০১XXXXXXXXX" 
                        className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পূর্ণ ঠিকানা</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-red-600" size={20} />
                      <Textarea 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                        placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" 
                        className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                        required 
                      />
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center space-y-2">
                      <XCircle className="mx-auto text-red-600" size={32} />
                      <h3 className="font-black text-red-800 uppercase">Stock Out</h3>
                      <p className="text-xs font-bold text-red-700">দুঃখিত, এই মুহূর্তে পণ্যটি স্টকে নেই।</p>
                    </div>
                  ) : isSuccess ? (
                    <div className="p-8 bg-green-50 border border-green-100 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
                      <CheckCircle2 className="mx-auto text-green-600" size={32} />
                      <h3 className="font-black text-green-800 uppercase">অর্ডার সফল হয়েছে!</h3>
                      <p className="text-xs font-bold text-green-700">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                    </div>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="w-full h-20 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase shadow-2xl active:scale-95 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : "অর্ডার সম্পন্ন করুন"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-gray-900 text-white/40 text-center">
        <div className="container mx-auto px-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Copyright © 2026 Smart Clean. All rights reserved.</p>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <Button onClick={scrollToForm} className="h-14 w-full rounded-2xl bg-[#FFD700] hover:bg-[#FFC800] text-black font-black text-sm uppercase tracking-widest shadow-xl border-none">
          অর্ডার করতে চাই <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>

      <a href={`https://wa.me/${page.phone || '8801919640422'}`} target="_blank" className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all"><Zap size={32} fill="white" /></a>

    </div>
  );
}
