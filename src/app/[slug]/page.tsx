'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, addDoc } from 'firebase/firestore';
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
  MessageCircle,
  ShoppingCart,
  Package,
  Info,
  MapPin,
  User,
  X,
  Volume2,
  Calendar,
  Wrench,
  Clock,
  ChevronRight,
  Plus,
  Minus,
  Check,
  CreditCard,
  Wallet
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

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

  // Dynamic Price Calculation
  const totalPrice = useMemo(() => {
    if (!page) return 0;
    if (isProduct) {
      return selectedProductPkg ? selectedProductPkg.discountPrice : (page.discountPrice || page.price || 0);
    } else {
      const pkgPrice = selectedServicePkg?.price || 0;
      const addonsPrice = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      return pkgPrice + addonsPrice;
    }
  }, [page, isProduct, selectedProductPkg, selectedServicePkg, selectedAddons]);

  const handleAddonToggle = (addon: any) => {
    setSelectedAddons(prev => 
      prev.find(a => a.name === addon.name) 
        ? prev.filter(a => a.name !== addon.name) 
        : [...prev, addon]
    );
  };

  const handleServiceTypeChange = (typeName: string) => {
    const type = page.serviceTypes.find((t: any) => t.name === typeName);
    setSelectedServiceType(type);
    setSelectedServicePkg(type?.packages?.[0] || null);
    setSelectedAddons([]);
  };

  const handleScrollToForm = () => {
    const form = document.getElementById('order-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !page) return;

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
        submissionData.items = [{
          id: page.id,
          name: page.title + (selectedProductPkg ? ` (${selectedProductPkg.name})` : ''),
          price: totalPrice,
          quantity: 1
        }];
        submissionData.deliveryCharge = 60;
        submissionData.totalPrice = totalPrice + 60;
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
        waMsg = `আসসালামু আলাইকুম, আমি ${page.title} ${selectedProductPkg ? `(${selectedProductPkg.name})` : ''} অর্ডার করতে চাই।\n\nনাম: ${formData.name}\nফোন: ${formData.phone}\nঠিকানা: ${formData.address}\nটোটাল: ৳${totalPrice + 60}`;
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

  // Theme Config
  const primaryColor = isProduct ? 'bg-[#D91E1E]' : 'bg-[#1E5F7A]';
  const primaryText = isProduct ? 'text-[#D91E1E]' : 'text-[#1E5F7A]';
  const accentColor = isProduct ? 'bg-[#FFD700]' : 'bg-[#22C55E]';
  const accentText = isProduct ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="bg-[#FDFDFD] min-h-screen font-body text-[#333]">
      
      {/* 1. HERO SECTION */}
      <section className={cn("relative text-white pt-10 pb-20 overflow-hidden transition-colors duration-500", primaryColor)}>
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10 space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight uppercase px-4 drop-shadow-xl">
              {page.title}
            </h1>
            <p className={cn("text-lg md:text-2xl font-bold drop-shadow-md", accentText)}>
              {page.subtitle}
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 aspect-video bg-black/20 group">
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
                className={cn("h-16 px-12 rounded-full text-black font-black text-xl uppercase tracking-tight shadow-2xl animate-pulse active:scale-95 transition-all w-full md:w-auto border-none", accentColor, isProduct ? "hover:bg-yellow-500" : "hover:bg-emerald-600 text-white")}
              >
                {isProduct ? '🛒 অর্ডার করতে চাই' : '🛒 সার্ভিস বুক করতে চাই'} <ArrowRight size={24} className="ml-2" />
              </Button>
              {page.phone && (
                <Button 
                  variant="outline"
                  className="h-16 px-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900 font-black text-lg uppercase gap-2 w-full md:w-auto"
                  asChild
                >
                  <a href={`tel:${page.phone}`}><Phone size={24} /> কল করুন</a>
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest bg-black/20 w-fit mx-auto px-6 py-2 rounded-full border border-white/10">
              <Zap size={16} className={accentText} fill="currentColor" /> {page.stockText || 'অফারটি সীমিত সময়ের জন্য'}
            </div>
          </div>
        </div>

        {/* Wave Bottom Decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-full fill-[#FDFDFD]">
            <path d="M0,160L48,176C96,192,192,208,288,213.3C384,219,480,213,576,186.7C672,160,768,112,864,112C960,112,1056,160,1152,181.3C1248,203,1344,197,1392,194.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* 2. TRUST / HIGHLIGHT SECTION */}
      <section className="py-12 container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, text: "Experienced Professionals", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Zap, text: "Fast & Reliable Service", color: "text-amber-600", bg: "bg-amber-50" },
            { icon: Award, text: "Trusted by 1000+ Customers", color: "text-green-600", bg: "bg-green-50" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm group hover:shadow-md transition-all">
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", item.bg, item.color)}>
                <item.icon size={24} />
              </div>
              <span className="font-bold text-sm text-gray-700 uppercase tracking-tight">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INGREDIENTS / TECHNOLOGY SECTION */}
      {page.ingredients && page.ingredients.length > 0 && (
        <section className="py-20 container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className={cn("text-3xl md:text-5xl font-black uppercase tracking-tighter", primaryText)}>
              {isProduct ? 'মূল উপাদান সমূহ' : 'ব্যবহৃত প্রযুক্তি ও কেমিক্যাল'}
            </h2>
            <div className={cn("w-20 h-1.5 mx-auto rounded-full", accentColor)} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {page.ingredients.map((ing: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-4 group p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-500">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 p-1 group-hover:border-primary transition-colors shadow-inner">
                  <Image src={ing.imageUrl || 'https://picsum.photos/seed/ing/200/200'} alt={ing.name} fill className="object-cover rounded-full" unoptimized />
                </div>
                <span className="text-sm font-black text-gray-800 uppercase tracking-tight text-center">{ing.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. BENEFITS SECTION */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase leading-tight">
                কেন এটি আপনার জন্য <span className={isProduct ? "text-red-600" : "text-blue-600"}>সেরা?</span>
              </h2>
              <div className="space-y-4">
                {page.benefits?.map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100 group hover:border-primary transition-all">
                    <div className={cn("p-1 rounded-full shrink-0 group-hover:text-white transition-colors", isProduct ? "text-red-600 bg-red-50 group-hover:bg-red-600" : "text-blue-600 bg-blue-50 group-hover:bg-blue-600")}>
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-lg font-bold text-gray-700 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square order-1 lg:order-2 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
              <Image src={page.imageUrl} alt="Benefits" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" unoptimized />
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US (BOX UI) */}
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

      {/* 6. SELECTION & ORDER FORM SECTION */}
      <section id="order-form" className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Area: Form & Deep Selection */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Step 1: Selection (Type/Package/Addons) */}
            <div className="space-y-10">
              <div className="space-y-2">
                <Badge className="bg-primary text-white border-none uppercase font-black text-[9px] px-3 py-1 rounded-full mb-2">Step 1</Badge>
                <h2 className={cn("text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none", primaryText)}>
                  {isProduct ? 'প্যাকেজ নির্বাচন করুন' : 'আপনার সার্ভিস কাস্টমাইজ করুন'}
                </h2>
              </div>

              {isProduct ? (
                /* Product Package Selection */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {page.packages?.map((pkg: any, i: number) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedProductPkg(pkg)}
                      className={cn(
                        "p-6 rounded-3xl border-4 transition-all cursor-pointer bg-white relative overflow-hidden",
                        selectedProductPkg?.name === pkg.name ? "border-red-600 shadow-xl scale-[1.02]" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {selectedProductPkg?.name === pkg.name && <div className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-bl-xl"><Check size={16} strokeWidth={4} /></div>}
                      <h3 className="font-black uppercase text-sm mb-4">{pkg.name}</h3>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 line-through">৳{pkg.price}</p>
                        <p className="text-3xl font-black text-red-600">৳{pkg.discountPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Service Deep Selection */
                <div className="space-y-8">
                  {/* Service Type Selection */}
                  {page.serviceTypes?.length > 1 && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">সার্ভিসের ধরন</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {page.serviceTypes.map((type: any) => (
                          <button
                            key={type.name}
                            onClick={() => handleServiceTypeChange(type.name)}
                            className={cn(
                              "p-3 rounded-xl border-2 font-bold text-xs uppercase transition-all",
                              selectedServiceType?.name === type.name ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                            )}
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Package Selection */}
                  {selectedServiceType?.packages?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">প্যাকেজ বেছে নিন</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {selectedServiceType.packages.map((pkg: any) => (
                          <div
                            key={pkg.name}
                            onClick={() => setSelectedServicePkg(pkg)}
                            className={cn(
                              "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[100px]",
                              selectedServicePkg?.name === pkg.name ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-white"
                            )}
                          >
                            <p className="font-black text-[10px] uppercase mb-2">{pkg.name}</p>
                            <p className="font-black text-lg text-blue-700">৳{pkg.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add-ons Selection */}
                  {selectedServiceType?.addons?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">অতিরিক্ত সার্ভিস (ঐচ্ছিক)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedServiceType.addons.map((addon: any) => {
                          const isActive = selectedAddons.find(a => a.name === addon.name);
                          return (
                            <div
                              key={addon.name}
                              onClick={() => handleAddonToggle(addon)}
                              className={cn(
                                "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                                isActive ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-white"
                              )}
                            >
                              <div>
                                <p className="font-bold text-[11px] uppercase">{addon.name}</p>
                                <p className="font-black text-[10px] text-emerald-600">+৳{addon.price}</p>
                              </div>
                              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", isActive ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200")}>
                                {isActive ? <Check size={14} strokeWidth={4} /> : <Plus size={14} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Information Form */}
            <div className="space-y-8">
              <div className="space-y-2">
                <Badge className="bg-primary text-white border-none uppercase font-black text-[9px] px-3 py-1 rounded-full mb-2">Step 2</Badge>
                <h2 className={cn("text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none", primaryText)}>
                  {isProduct ? 'অর্ডার কনফার্ম করুন' : 'বুকিং নিশ্চিত করুন'}
                </h2>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার নাম</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="আপনার নাম লিখুন" 
                      className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ফোন নম্বর</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <Input 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="ফোন নম্বর লিখুন" 
                      className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">পূর্ণ ঠিকানা</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-primary" size={20} />
                    <Textarea 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা" 
                      className="min-h-[120px] pl-12 pt-4 bg-gray-50 border-none rounded-2xl font-bold text-lg" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">পেমেন্ট পদ্ধতি</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                      className={cn(
                        "p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all",
                        formData.paymentMethod === 'cod' ? "border-green-600 bg-green-50" : "border-gray-100 bg-gray-50"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", formData.paymentMethod === 'cod' ? "bg-green-600 text-white" : "bg-white text-gray-400")}>
                        <Wallet size={18} />
                      </div>
                      <span className="font-bold text-sm uppercase">{isProduct ? 'ক্যাশ অন ডেলিভারি' : 'কাজ শেষে পেমেন্ট'}</span>
                    </div>
                    <div 
                      className="p-4 rounded-2xl border-2 flex items-center gap-3 cursor-not-allowed opacity-50 bg-gray-50 border-gray-100"
                    >
                      <div className="p-2 rounded-lg bg-white text-gray-400">
                        <CreditCard size={18} />
                      </div>
                      <span className="font-bold text-sm uppercase">অনলাইন পেমেন্ট</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-4 text-green-700 font-black uppercase tracking-widest text-[10px]">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-green-600"><ShieldCheck size={24} /></div>
                  সুরক্ষিত পেমেন্ট ও ফাস্ট ডেলিভারি নিশ্চিত।
                </div>

                {isSuccess ? (
                  <div className="p-10 bg-green-100 border-2 border-green-200 rounded-[2rem] text-center space-y-4 animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-green-800 uppercase tracking-tight">সফলভাবে সাবমিট হয়েছে!</h3>
                    <p className="text-green-700 font-bold">আপনাকে হোয়াটসঅ্যাপে রিডাইরেক্ট করা হচ্ছে...</p>
                  </div>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={cn("w-full h-20 rounded-[2rem] text-white font-black text-2xl uppercase tracking-tight shadow-2xl active:scale-95 transition-all border-none", isProduct ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20")}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : (isProduct ? "অর্ডার সম্পন্ন করুন" : "বুকিং নিশ্চিত করুন")}
                  </Button>
                )}
              </form>
            </div>
          </div>

          {/* Right Area: Checkout/Summary Sidebar (Sticky) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center justify-between">
                  {isProduct ? 'অর্ডার সামারি' : 'বুকিং সামারি'}
                  <ShoppingCart size={24} className="text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                    <Image src={page.imageUrl} alt={page.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-gray-900 uppercase text-xs leading-tight line-clamp-2">{page.title}</h4>
                    {isProduct ? (
                      selectedProductPkg && <Badge className="bg-red-50 text-red-600 border-none uppercase font-black text-[9px] px-2 py-0.5">{selectedProductPkg.name}</Badge>
                    ) : (
                      selectedServiceType && <Badge className="bg-blue-50 text-blue-600 border-none uppercase font-black text-[9px] px-2 py-0.5">{selectedServiceType.name}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                    <span>{isProduct ? 'প্যাকেজ মূল্য' : (selectedServicePkg?.name || 'বেস প্রাইজ')}</span>
                    <span className="text-gray-900">৳{isProduct ? (selectedProductPkg?.discountPrice || page.discountPrice) : (selectedServicePkg?.price || 0)}</span>
                  </div>
                  
                  {!isProduct && selectedAddons.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">নির্বাচিত অ্যাড-অন</p>
                      {selectedAddons.map(a => (
                        <div key={a.name} className="flex justify-between text-[10px] font-bold text-emerald-600">
                          <span>+ {a.name}</span>
                          <span>৳{a.price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isProduct && (
                    <div className="flex justify-between font-bold text-gray-500 uppercase text-xs tracking-widest">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="text-primary">৳৬০</span>
                    </div>
                  )}

                  <div className="pt-6 border-t-2 border-primary/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">সর্বমোট</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
                        ৳{isProduct ? totalPrice + 60 : totalPrice}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] px-3 py-1 rounded-full uppercase">Secure</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-[2rem] bg-yellow-50 border-2 border-yellow-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-yellow-600"><Info size={20} /></div>
                <h4 className="font-black uppercase text-sm tracking-tight text-yellow-900">{isProduct ? 'ডেলিভারি' : 'বুকিং'} সংক্রান্ত</h4>
              </div>
              <p className="text-sm font-medium text-yellow-800 leading-relaxed">
                {isProduct 
                  ? 'ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩-৫ দিনের মধ্যে ডেলিভারি সম্পন্ন করা হয়।'
                  : 'বুকিং করার পর ১ ঘণ্টার মধ্যে আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করে সময় নিশ্চিত করবেন।'}
              </p>
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
          <div className="space-y-0.5 min-w-[100px]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest line-through">৳{isProduct ? (selectedProductPkg?.price || page.price) : (totalPrice + 500)}</p>
            <p className="text-2xl font-black text-primary tracking-tighter leading-none">৳{isProduct ? totalPrice + 60 : totalPrice}</p>
          </div>
          <Button onClick={handleScrollToForm} className={cn("h-14 flex-1 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl border-none", isProduct ? "bg-red-600 shadow-red-600/20" : "bg-blue-600 shadow-blue-600/20")}>
            {isProduct ? 'অর্ডার করতে চাই' : 'বুকিং করতে চাই'} <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>

    </div>
  );
}
