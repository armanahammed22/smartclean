
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  Star, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Loader2,
  Award,
  Phone,
  ShoppingCart,
  Package,
  Info,
  MapPin,
  User,
  Check,
  CreditCard,
  Wallet,
  XCircle,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  // Selection States
  const [selectedProductPkg, setSelectedProductPkg] = useState<any>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<any>(null);
  const [selectedServicePkg, setSelectedServicePkg] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Fetch Linked Product (if exists)
  const productRef = useMemoFirebase(() => (db && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page?.productId]);
  const { data: linkedProduct } = useDoc(productRef);

  // 3. Fetch Best Selling Products
  const bestSellingQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'products'), where('isBestSelling', '==', true), limit(8)) : null, [db]);
  const { data: bestSelling } = useCollection(bestSellingQuery);

  const pageType = page?.type || 'product';
  const isProduct = pageType === 'product';

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  useEffect(() => {
    if (page && mounted) {
      trackEvent('ViewContent', {
        content_name: page.title,
        content_category: isProduct ? 'Product Landing Page' : 'Service Landing Page'
      });

      if (isProduct && page.packages?.length > 0) {
        setSelectedProductPkg(page.packages[0]);
      } else if (!isProduct && page.serviceTypes?.length > 0) {
        const firstService = page.serviceTypes[0];
        setSelectedServiceType(firstService);
        if (firstService.packages?.length > 0) {
          setSelectedServicePkg(firstService.packages[0]);
        }
      }
    }
  }, [page, mounted, isProduct]);

  // Stock Check
  const isOutOfStock = isProduct && linkedProduct && (linkedProduct.stockQuantity <= 0);

  // Dynamic Price Calculation
  const subtotal = useMemo(() => {
    if (!page) return 0;
    if (isProduct) {
      return selectedProductPkg ? selectedProductPkg.discountPrice : (page.discountPrice || page.price || 0);
    } else {
      const pkgPrice = selectedServicePkg?.price || 0;
      const addonsPrice = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      return pkgPrice + addonsPrice;
    }
  }, [page, isProduct, selectedProductPkg, selectedServicePkg, selectedAddons]);

  const discountAmount = useMemo(() => {
    if (isProduct && selectedProductPkg) {
      return (selectedProductPkg.price || 0) - selectedProductPkg.discountPrice;
    }
    return 0;
  }, [isProduct, selectedProductPkg]);

  const deliveryCharge = isProduct ? 60 : 0;
  const totalPrice = subtotal + deliveryCharge;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

    if (isOutOfStock) {
      toast({ variant: "destructive", title: "Stock Out", description: "This product is currently out of stock." });
      return;
    }

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "অনুগ্রহ করে আপনার নাম, ফোন নম্বর এবং ঠিকানা দিন।" });
      return;
    }

    setIsSubmitting(true);

    try {
      const collectionName = isProduct ? 'orders' : 'bookings';
      const submissionData: any = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        status: 'New',
        source: page.slug,
        createdAt: new Date().toISOString(),
        totalPrice: totalPrice,
        paymentMethod: formData.paymentMethod,
        riskLevel: 'Low',
        isSuspicious: false
      };

      if (isProduct) {
        submissionData.productId = page.productId || null;
        submissionData.items = [{
          id: page.productId || page.id,
          name: page.title + (selectedProductPkg ? ` (${selectedProductPkg.name})` : ''),
          price: subtotal,
          quantity: 1
        }];
        submissionData.deliveryCharge = 60;
        
        // Stock reduction logic
        if (page.productId) {
          await updateDoc(doc(db, 'products', page.productId), {
            stockQuantity: increment(-1)
          });
        }
      } else {
        submissionData.serviceId = page.id;
        submissionData.serviceTitle = page.title;
        submissionData.serviceType = selectedServiceType?.name || 'General';
        submissionData.packageName = selectedServicePkg?.name || 'Standard';
        submissionData.packagePrice = selectedServicePkg?.price || 0;
        submissionData.addons = selectedAddons;
        submissionData.notes = formData.note;
      }

      await addDoc(collection(db, collectionName), submissionData);
      
      trackEvent(isProduct ? 'Purchase' : 'Lead', {
        content_name: page.title,
        value: totalPrice,
        currency: 'BDT'
      });

      setIsSuccess(true);
      toast({ title: isProduct ? "অর্ডার সফল হয়েছে!" : "বুকিং সফল হয়েছে!", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।" });

      // Generate WhatsApp Message
      const waNumber = page.phone || '8801919640422';
      const cleanWa = waNumber.replace(/\D/g, '');
      let waMsg = '';
      if (isProduct) {
        waMsg = `আসসালামু আলাইকুম, আমি ${page.title} ${selectedProductPkg ? `(${selectedProductPkg.name})` : ''} অর্ডার করতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nটোটাল: ৳${totalPrice}`;
      } else {
        const addonList = selectedAddons.map(a => a.name).join(', ');
        waMsg = `আসসালামু আলাইকুম, আমি ${page.title} (${selectedServiceType?.name}) সার্ভিস বুক করতে চাই।\n\nপ্যাকেজ: ${selectedServicePkg?.name}\nঅ্যাড-অন: ${addonList || 'None'}\nটোটাল: ৳${totalPrice}\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}`;
      }
      
      setTimeout(() => {
        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(waMsg)}`, '_blank');
        router.push(`/order-success?id=success&type=${isProduct ? 'order' : 'booking'}`);
      }, 1500);

    } catch (error) {
      toast({ variant: "destructive", title: "দুঃখিত", description: "প্রসেসিংটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Experience...</p>
    </div>
  );

  if (!page || !page.active) return null;

  const primaryColor = isProduct ? 'bg-[#D91E1E]' : 'bg-[#1E5F7A]';
  const accentColor = isProduct ? 'bg-[#FFD700]' : 'bg-[#22C55E]';

  return (
    <div className="bg-[#FDFDFD] min-h-screen font-body text-[#333]">
      
      {/* 1. HERO SECTION */}
      {page.useCustomBanner && page.bannerImage ? (
        <section className="w-full relative">
          <div className="relative aspect-[21/9] md:aspect-[21/7] w-full">
            <Image src={page.bannerImage} alt={page.title} fill className="object-cover" priority unoptimized />
          </div>
          <div className="container mx-auto px-4 py-6 text-center">
             <Button onClick={() => document.getElementById('order-form')?.scrollIntoView({behavior: 'smooth'})} className={cn("h-14 px-10 rounded-full font-black text-lg uppercase shadow-xl animate-bounce", accentColor, isProduct ? "text-black" : "text-white")}>
               🛒 অর্ডার করতে চাই
             </Button>
          </div>
        </section>
      ) : (
        <section className={cn("relative text-white pt-10 pb-20 overflow-hidden", primaryColor)}>
          <div className="container mx-auto px-4 max-w-5xl text-center relative z-10 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight uppercase drop-shadow-xl">{page.title}</h1>
              <p className="text-lg md:text-2xl font-bold text-yellow-400">{page.subtitle}</p>
            </div>
            <div className="relative mx-auto max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/20">
              {page.videoUrl ? (
                <iframe src={`https://www.youtube.com/embed/${page.videoUrl.split('v=')[1] || page.videoUrl.split('/').pop()}`} className="w-full h-full" allowFullScreen />
              ) : (
                <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
              )}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
              <Button onClick={() => document.getElementById('order-form')?.scrollIntoView({behavior: 'smooth'})} className={cn("h-16 px-12 rounded-full font-black text-xl uppercase shadow-2xl active:scale-95 transition-all w-full md:w-auto", accentColor, isProduct ? "text-black hover:bg-yellow-500" : "text-white hover:bg-emerald-600")}>
                {isProduct ? '🛒 অর্ডার করতে চাই' : '🛒 সার্ভিস বুক করতে চাই'}
              </Button>
              {page.phone && (
                <Button variant="outline" className="h-16 px-8 rounded-full border-2 border-white bg-black text-white hover:bg-white hover:text-black font-black text-lg uppercase gap-2 w-full md:w-auto" asChild>
                  <a href={`tel:${page.phone}`}><Phone size={24} /> {page.phone}</a>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-black/20 w-fit mx-auto px-6 py-2 rounded-full border border-white/10">
              <Zap size={14} className="text-yellow-400" fill="currentColor" /> {page.stockText || 'অফারটি সীমিত সময়ের জন্য'}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
            <svg viewBox="0 0 1440 320" className="w-full h-full fill-[#FDFDFD]"><path d="M0,160L48,176C96,192,192,208,288,213.3C384,219,480,213,576,186.7C672,160,768,112,864,112C960,112,1056,160,1152,181.3C1248,203,1344,197,1392,194.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
          </div>
        </section>
      )}

      {/* 2. BEST SELLING SECTION */}
      {bestSelling && bestSelling.length > 0 && (
        <section className="py-12 bg-white overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="text-red-600" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#081621]">যে সকল পণ্যগুলো বেশি বিক্রি হচ্ছে</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
              {bestSelling.map((prod) => (
                <Link key={prod.id} href={`/product/${prod.id}`} className="min-w-[140px] md:min-w-[180px] group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition-all">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                      <Image src={prod.imageUrl} alt={prod.name} fill className="object-contain p-2" unoptimized />
                    </div>
                    <h4 className="text-[10px] md:text-xs font-bold text-center line-clamp-2 uppercase group-hover:text-red-600">{prod.name}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. BENEFITS / INGREDIENTS */}
      {page.ingredients && page.ingredients.length > 0 && (
        <section className="py-20 container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase text-center mb-16 tracking-tighter">মূল উপাদান সমূহ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {page.ingredients.map((ing: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-inner">
                  <Image src={ing.imageUrl || 'https://picsum.photos/seed/ing/200/200'} alt={ing.name} fill className="object-cover" unoptimized />
                </div>
                <span className="text-sm font-black text-gray-800 uppercase tracking-tight text-center">{ing.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DETAILS / BENEFITS LIST */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase">কেন এটি আপনার জন্য <span className={isProduct ? "text-red-600" : "text-blue-600"}>সেরা?</span></h2>
              <div className="space-y-4">
                {page.benefits?.map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:border-primary transition-all">
                    <div className={cn("p-1 rounded-full shrink-0", isProduct ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50")}>
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-lg font-bold text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square order-1 lg:order-2 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <Image src={page.imageUrl} alt="Benefits" fill className="object-cover" unoptimized />
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <Card className="rounded-[3rem] border-4 border-dashed border-primary/20 bg-white p-10 md:p-16 text-center space-y-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12"><Award size={200} /></div>
          <Badge className="bg-primary text-white border-none uppercase font-black tracking-widest px-6 py-2 rounded-full text-xs">Why Choose Us</Badge>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#081621] tracking-tighter">আমাদের বিশেষত্ব</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {page.whyChoose?.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Check size={20} className="text-green-600 shrink-0" strokeWidth={4} />
                <span className="font-bold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 6. ORDER & SUMMARY SECTION */}
      <section id="order-form" className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <Badge className="bg-primary text-white border-none uppercase font-black text-[9px] px-3 py-1 rounded-full">Step 1</Badge>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{isProduct ? 'অর্ডার কনফার্ম করুন' : 'বুকিং নিশ্চিত করুন'}</h2>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার নাম</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="আপনার নাম লিখুন" className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ফোন নম্বর</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="ফোন নম্বর লিখুন" className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">পূর্ণ ঠিকানা</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-primary" size={20} />
                  <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg" required />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-4 text-green-700 font-black uppercase tracking-widest text-[10px]">
                <ShieldCheck size={24} className="text-green-600" />
                ক্যাশ অন ডেলিভারি সুবিধা এভেইলএবল।
              </div>

              {isOutOfStock ? (
                <div className="p-10 bg-red-50 border-2 border-red-100 rounded-[2rem] text-center space-y-4">
                  <XCircle className="mx-auto text-red-600" size={48} />
                  <h3 className="text-2xl font-black text-red-800 uppercase">Stock Out</h3>
                  <p className="text-red-700 font-bold">দুঃখিত, এই মুহূর্তে পণ্যটি স্টকে নেই।</p>
                </div>
              ) : isSuccess ? (
                <div className="p-10 bg-green-100 border-2 border-green-200 rounded-[2rem] text-center space-y-4 animate-in zoom-in-95">
                  <CheckCircle2 className="mx-auto text-green-600" size={48} />
                  <h3 className="text-2xl font-black text-green-800 uppercase">সফল হয়েছে!</h3>
                  <p className="text-green-700 font-bold">আপনাকে হোয়াটসঅ্যাপে রিডাইরেক্ট করা হচ্ছে...</p>
                </div>
              ) : (
                <Button type="submit" disabled={isSubmitting} className={cn("w-full h-20 rounded-[2rem] text-white font-black text-2xl uppercase shadow-2xl active:scale-95 transition-all border-none", isProduct ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : (isProduct ? "অর্ডার সম্পন্ন করুন" : "বুকিং নিশ্চিত করুন")}
                </Button>
              )}
            </form>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center justify-between">অর্ডার সামারি <ShoppingCart size={24} className="text-primary" /></CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-gray-900 uppercase text-xs leading-tight line-clamp-2">{page.title}</h4>
                    {selectedProductPkg && <Badge className="bg-red-50 text-red-600 border-none uppercase font-black text-[9px] px-2 py-0.5">{selectedProductPkg.name}</Badge>}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                    <span>পণ্যের মূল্য</span>
                    <span className="text-gray-900">৳{subtotal + discountAmount}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-black text-red-600 uppercase text-xs tracking-widest">
                      <span>ডিসকাউন্ট অফার 🔥</span>
                      <span>- ৳{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-primary">৳{deliveryCharge}</span>
                  </div>

                  <div className="pt-6 border-t-2 border-primary/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">সর্বমোট পেবল</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">৳{totalPrice}</p>
                    </div>
                    {discountAmount > 0 && <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] px-3 py-1 rounded-full">আপনি ৳{discountAmount} বাঁচিয়েছেন!</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-[2rem] bg-yellow-50 border-2 border-yellow-200 space-y-4">
              <div className="flex items-center gap-3">
                <Info className="text-yellow-600" size={20} />
                <h4 className="font-black uppercase text-sm tracking-tight text-yellow-900">ডেলিভারি সংক্রান্ত</h4>
              </div>
              <p className="text-sm font-medium text-yellow-800 leading-relaxed">ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩-৫ দিনের মধ্যে ডেলিভারি সম্পন্ন করা হয়।</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#081621] text-white/40 text-center mb-20 md:mb-0">
        <div className="container mx-auto px-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Copyright © 2026 Smart Clean. All rights reserved.</p>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-gray-400 uppercase line-through">৳{subtotal + discountAmount}</p>
            <p className="text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice}</p>
          </div>
          <Button onClick={() => document.getElementById('order-form')?.scrollIntoView({behavior: 'smooth'})} className={cn("h-14 flex-1 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl border-none", isProduct ? "bg-red-600" : "bg-blue-600")}>
            অর্ডার করতে চাই <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      <a href="https://wa.me/8801919640422" target="_blank" className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all"><MessageCircle size={32} /></a>

    </div>
  );
}
