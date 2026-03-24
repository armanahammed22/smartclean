
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
  Zap,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Wrench,
  Clock,
  Layout,
  ShieldCheck,
  Building2,
  Box,
  TicketPercent
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
import Link from 'next/link';

export default function UnifiedLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Independent States
  const [quantity, setQuantity] = useState(1);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Landing Page Config
  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  // 2. Product Mode: Fetch actual linked product
  const productRef = useMemoFirebase(() => 
    (db && page?.type === 'product' && page?.productId) ? doc(db, 'products', page.productId) : null, [db, page]);
  const { data: linkedProduct, isLoading: productLoading } = useDoc(productRef);

  // 3. Dynamic Catalog Logic
  const catalogQuery = useMemoFirebase(() => {
    if (!db || !page?.showCatalogGrid) return null;
    return query(collection(db, page.catalogSource || 'products'), where('status', '==', 'Active'), limit(page.catalogLimit || 8));
  }, [db, page]);
  const { data: catalogItems } = useCollection(catalogQuery);

  useEffect(() => {
    if (!isLoading && mounted && (!page || !page.active)) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  if (!mounted || isLoading || (page?.type === 'product' && productLoading)) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  if (!page) return null;

  const isService = page.type === 'service';
  const displayPrice = isService ? (page.packages?.[selectedPkgIndex]?.price || 0) : (linkedProduct?.price || 0);
  const deliveryCharge = isService ? 0 : 60;
  const totalPrice = (displayPrice * quantity) + deliveryCharge;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "Information Required", description: "Name, phone and address are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        items: [{
          id: page.productId || page.id,
          name: isService ? `${page.title} (${page.packages[selectedPkgIndex]?.name})` : (linkedProduct?.name || page.title),
          price: displayPrice,
          quantity: quantity
        }],
        totalPrice,
        status: 'New',
        type: page.type,
        source: page.slug,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, isService ? 'bookings' : 'orders'), orderData);
      
      if (!isService && page.productId) {
        await updateDoc(doc(db, 'products', page.productId), { stockQuantity: increment(-quantity) });
      }

      trackEvent(isService ? 'Lead' : 'Purchase', { value: totalPrice, currency: 'BDT', content_name: page.title });
      
      const intent = isService ? 'Service Booking' : 'Order';
      let waMsg = `Hello, I want to ${intent} for ${orderData.items[0].name}.\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}\nTotal: ৳${totalPrice}`;
      window.open(`https://wa.me/${page.phone || '8801919640422'}?text=${encodeURIComponent(waMsg)}`, '_blank');
      
      router.push('/order-success?id=success');
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("min-h-screen", isService ? "bg-[#F8FAFC]" : "bg-white")}>
      
      {/* 🟢 SERVICE MODE HERO */}
      {isService && (
        <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white pt-12 pb-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl space-y-6">
            <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Service Booking</Badge>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none drop-shadow-lg">{page.heroTitle || page.title}</h1>
            <p className="text-white/80 font-medium max-w-xl mx-auto">{page.heroSubtitle}</p>
            
            <div className="relative aspect-video max-w-2xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 mt-8">
              {page.heroBanner ? (
                <Image src={page.heroBanner} alt="Hero" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center"><Wrench size={80} className="opacity-20" /></div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 🔴 PRODUCT MODE HERO */}
      {!isService && (
        <section className="bg-gradient-to-b from-red-600 to-red-800 text-white pt-12 pb-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl space-y-6">
            <Badge className="bg-yellow-400 text-red-700 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mega Sale Live</Badge>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none drop-shadow-lg">{linkedProduct?.name || page.title}</h1>
            
            <div className="relative aspect-square max-w-md mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-white mt-8 p-4">
              {linkedProduct?.imageUrl ? (
                <Image src={linkedProduct.imageUrl} alt="Product" fill className="object-contain p-8" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center"><Box size={100} className="text-gray-200" /></div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-2 pt-4">
              <span className="text-yellow-400 text-4xl font-black">৳{linkedProduct?.price?.toLocaleString()}</span>
              {linkedProduct?.regularPrice && <span className="text-white/40 line-through font-bold">৳{linkedProduct.regularPrice.toLocaleString()}</span>}
            </div>
          </div>
        </section>
      )}

      {/* 🛠️ SERVICE PACKAGES (ONLY IN SERVICE MODE) */}
      {isService && page.packages?.length > 0 && (
        <section className="py-20 px-4 container mx-auto max-w-6xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Available Packages</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Select the perfect plan for your needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {page.packages.map((pkg: any, i: number) => (
              <Card 
                key={i} 
                onClick={() => setSelectedPkgIndex(i)}
                className={cn(
                  "rounded-3xl border-4 transition-all cursor-pointer p-8 space-y-6",
                  selectedPkgIndex === i ? "border-blue-600 bg-blue-50/50 shadow-xl scale-105" : "border-gray-100 hover:border-blue-200"
                )}
              >
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[8px] font-black uppercase mb-2">{pkg.category}</Badge>
                  <h3 className="text-xl font-black uppercase text-gray-900 leading-none">{pkg.name}</h3>
                </div>
                <p className="text-3xl font-black text-blue-600">৳{pkg.price}</p>
                <Button className={cn("w-full h-12 rounded-xl font-black uppercase text-[10px]", selectedPkgIndex === i ? "bg-blue-600" : "bg-gray-100 text-gray-400")}>
                  {selectedPkgIndex === i ? 'SELECTED' : 'SELECT PLAN'}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 📋 SHARED ORDER SECTION (UI changes based on mode) */}
      <section className="py-24 px-4 bg-gray-50/50">
        <div className="container mx-auto max-w-6xl">
          <div className={cn("p-6 text-white text-center rounded-t-[2.5rem] max-w-xl mx-auto shadow-xl relative z-10", isService ? "bg-blue-600" : "bg-red-600")}>
            <h2 className="text-xl font-black uppercase tracking-widest">{isService ? 'Booking Form' : 'Order Form'}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 -mt-4">
            {/* Form */}
            <div className="lg:col-span-7 bg-white p-10 md:p-16 rounded-b-[3rem] rounded-tl-[3rem] shadow-2xl border-t-[12px] border-gray-100">
              <form onSubmit={handleAction} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-6 text-primary" size={20} />
                    <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="House, Area, District" className="min-h-[120px] pl-12 pt-6 bg-gray-50 border-none rounded-2xl font-bold" required />
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className={cn("w-full h-20 rounded-[2rem] text-white font-black text-2xl uppercase shadow-2xl transition-all active:scale-95", isService ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700")}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (isService ? "Confirm Booking" : "Confirm Order")}
                </Button>
              </form>
            </div>

            {/* Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
              <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                <CardHeader className={cn("p-8 text-white", isService ? "bg-blue-600" : "bg-red-600")}>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4 border-b pb-6">
                    <div className="relative w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border">
                      {isService ? <Wrench size={32} className="absolute inset-0 m-auto text-blue-200" /> : <Image src={linkedProduct?.imageUrl || ''} alt="Summary" fill className="object-contain p-2" unoptimized />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900 uppercase text-xs">
                        {isService ? `${page.title} - ${page.packages[selectedPkgIndex]?.name}` : (linkedProduct?.name || page.title)}
                      </h4>
                      {!isService && (
                        <div className="flex items-center gap-4 mt-3">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 bg-gray-100 rounded-lg"><Minus size={14} /></button>
                          <span className="font-black text-lg">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="p-1 bg-gray-100 rounded-lg"><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Price</span>
                      <span className="text-gray-900">৳{displayPrice}</span>
                    </div>
                    {!isService && (
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                        <span>Delivery Fee</span>
                        <span className="text-blue-600">৳{deliveryCharge}</span>
                      </div>
                    )}
                    <div className="pt-6 border-t-4 border-dashed flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Payable</p>
                        <p className={cn("text-4xl font-black tracking-tighter", isService ? "text-blue-600" : "text-red-600")}>৳{totalPrice}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] px-3 py-1">CASH ON DELIVERY</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 CATALOG GRID (SHARED BUT SYNCED) */}
      {page.showCatalogGrid && (
        <section className="py-24 border-t bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-2xl font-black uppercase text-center mb-12">{page.catalogTitle || 'Recommended for you'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {catalogItems?.map(item => (
                <Link key={item.id} href={`/${item.slug || item.id}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all block">
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={item.imageUrl} alt="Item" fill className="object-contain p-4 group-hover:scale-110 transition-transform" unoptimized />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-[11px] uppercase truncate">{item.name || item.title}</h3>
                    <p className="font-black text-primary">৳{item.price || item.basePrice}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
