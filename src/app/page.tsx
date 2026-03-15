
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, doc, where, limit, orderBy } from 'firebase/firestore';
import { 
  BellRing, 
  Clock, 
  Mail,
  Phone,
  ArrowRight,
  Package,
  Wrench,
  Star,
  ChevronRight,
  Loader2,
  ChevronDown,
  Satellite,
  Thermometer,
  Plane,
  Camera,
  Tv,
  Smartphone,
  Tablet,
  Glasses,
  Watch,
  Video,
  Grid,
  Monitor,
  Zap,
  LayoutDashboard,
  Users,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Briefcase,
  Settings,
  Plus,
  Calendar,
  Share2,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const ICONS: Record<string, any> = {
  Satellite, Thermometer, Plane, Camera, Tv, Smartphone, Tablet, Glasses, Watch, Video, Grid, Monitor, Zap, Wrench, Package, LayoutDashboard, Users, ShoppingCart, Briefcase, Settings, Calendar, Share2, CreditCard, ShieldCheck
};

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const [marqueeText, setMarqueeText] = useState<string>('');
  const [showAllLinks, setShowAllLinks] = useState(false);
  const db = useFirestore();

  // Role Checks
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  const profileRef = useMemoFirebase(() => user ? doc(db, 'customer_profiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  // Data Fetching
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(linksQuery);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: quickActions } = useCollection(actionsQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(8)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(6)) : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    setMarqueeText(`${dateStr} | Clean Tech Excellence | Bangladesh's Leading CRM for Cleaning Operations.`);
  }, [language]);

  const carouselOffers = offers?.filter(o => o.placement === 'top');

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6 pb-12 bg-[#F2F4F8]">
        
        {/* 0. Admin Dashboard Summary (Integrated) */}
        {isAdmin && (
          <section className="container mx-auto px-4 pt-6">
            <div className="bg-[#081621] text-white p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <LayoutDashboard size={160} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                      <ShieldCheck className="text-primary" /> Management Command Center
                    </h2>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Real-time Operations Overview</p>
                  </div>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold h-11" asChild>
                    <Link href="/admin/dashboard">Open Full Admin <ArrowRight size={16} /></Link>
                  </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Leads', val: '842', color: 'text-blue-400', icon: Briefcase },
                    { label: 'Sales', val: '৳1.4M', color: 'text-green-400', icon: ShoppingCart },
                    { label: 'Growth', val: '+12%', color: 'text-primary', icon: TrendingUp },
                    { label: 'Active Staff', val: '24', color: 'text-amber-400', icon: UserCheck }
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-white/40 uppercase mb-1">{s.label}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xl font-black", s.color)}>{s.val}</span>
                        <s.icon size={16} className="text-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 0.1 Customer Activity Summary (Integrated) */}
        {user && !isAdmin && (
          <section className="container mx-auto px-4 pt-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Welcome back, {user.displayName?.split(' ')[0]}!</h2>
                  <p className="text-xs text-muted-foreground font-bold">You have 2 active bookings pending.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" size="sm" className="flex-1 md:flex-none h-11 rounded-xl font-bold" asChild>
                  <Link href="/account/history">History</Link>
                </Button>
                <Button size="sm" className="flex-1 md:flex-none h-11 rounded-xl font-bold shadow-lg shadow-primary/20" asChild>
                  <Link href="/account/dashboard">Dashboard <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 1. Quick Links Grid */}
        <section className="bg-white py-8 border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
              {(showAllLinks ? quickLinks : quickLinks?.slice(0, 10))?.map((link) => {
                const Icon = ICONS[link.iconName] || Grid;
                return (
                  <Link key={link.id} href={link.link || '#'} className="flex flex-col items-center gap-3 group">
                    <div className="p-4 bg-gray-50 rounded-full text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <Icon size={28} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight text-center">{link.label}</span>
                  </Link>
                );
              })}
            </div>
            {quickLinks && quickLinks.length > 10 && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="ghost" 
                  className="gap-2 text-primary font-bold text-sm hover:bg-transparent"
                  onClick={() => setShowAllLinks(!showAllLinks)}
                >
                  {showAllLinks ? 'Show less' : 'Show more'} <ChevronDown size={16} className={cn("transition-transform", showAllLinks && "rotate-180")} />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* 2. Promotional Slider */}
        <section className="container mx-auto px-4">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {carouselOffers?.length ? carouselOffers.map((offer) => (
                <CarouselItem key={offer.id}>
                  <Link href={offer.link || '#'} className="block relative aspect-[21/9] md:aspect-[21/7] rounded-[2rem] overflow-hidden shadow-2xl">
                    <Image src={offer.imageUrl} alt={offer.title || 'Promo'} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 md:p-12">
                       <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight">{offer.title}</h2>
                    </div>
                  </Link>
                </CarouselItem>
              )) : (
                <CarouselItem>
                  <div className="relative aspect-[21/9] md:aspect-[21/7] rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                    <div className="text-center space-y-4 px-8">
                      <Badge className="bg-white text-primary border-none uppercase tracking-widest">Special Event</Badge>
                      <h2 className="text-3xl md:text-6xl font-black uppercase font-headline">Welcome to Smart Clean</h2>
                      <p className="text-lg opacity-80 max-w-xl mx-auto">Explore our high-performance cleaning tools and professional maintenance services.</p>
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/20 text-white border-none hover:bg-white/40" />
            <CarouselNext className="right-4 bg-white/20 text-white border-none hover:bg-white/40" />
          </Carousel>
        </section>

        {/* 3. Marquee */}
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-full h-12 shadow-sm border border-gray-100 flex items-center overflow-hidden">
            <div className="h-full bg-primary px-6 flex items-center gap-2 z-10 text-white font-black text-xs uppercase tracking-widest">
              <BellRing size={16} /> INFO
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
               <p className="animate-marquee inline-block whitespace-nowrap text-xs md:text-sm font-medium text-gray-600 px-4">
                 {marqueeText}
               </p>
            </div>
          </div>
        </section>

        {/* 4. Quick Action Cards */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions?.length ? quickActions.map((action) => {
              const Icon = ICONS[action.iconName] || Zap;
              return (
                <Link key={action.id} href={action.link || '#'} className={`bg-gradient-to-br ${action.bgGradient} rounded-3xl p-8 flex items-center justify-between shadow-xl group hover:shadow-2xl transition-all overflow-hidden relative`}>
                  <div className="space-y-4 relative z-10">
                    <Icon size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight">{action.title}</h3>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12">
                    <Icon size={120} className="text-white" />
                  </div>
                </Link>
              );
            }) : (
              <>
                <Link href="/services" className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 flex items-center justify-between shadow-xl group overflow-hidden relative">
                  <div className="space-y-4 relative z-10">
                    <Wrench size={48} className="text-white opacity-80" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight">Expert Booking</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-10 rotate-12"><Wrench size={120} className="text-white" /></div>
                </Link>
                <Link href="/products" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 flex items-center justify-between shadow-xl group overflow-hidden relative">
                  <div className="space-y-4 relative z-10">
                    <Package size={48} className="text-white opacity-80" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight">Product Finder</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-10 rotate-12"><Package size={120} className="text-white" /></div>
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-16 mt-8">
          
          {/* Services Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-3xl font-black font-headline text-[#081621]">Expert Services</h2>
                <p className="text-muted-foreground">Professional maintenance solutions for home and office.</p>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button variant="outline" className="gap-2 font-bold border-primary text-primary" asChild>
                    <Link href="/admin/services"><Plus size={16} /> Add Service</Link>
                  </Button>
                )}
                <Button variant="link" className="gap-2 font-bold" asChild>
                  <Link href="/services">View All <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {servicesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {services?.map((service) => (
                  <Link key={service.id} href={`/service/${service.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20 flex flex-col relative">
                    {isAdmin && (
                      <div className="absolute top-2 right-2 z-20">
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg" asChild>
                          <Link href="/admin/services"><Settings size={14} /></Link>
                        </Button>
                      </div>
                    )}
                    <div className="relative aspect-video overflow-hidden">
                      <Image 
                        src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                        alt={service.title || 'Cleaning Service'} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-primary border-none shadow-sm backdrop-blur-sm font-black hidden sm:inline-flex">{service.category || 'General'}</Badge>
                      </div>
                    </div>
                    <div className="p-3 md:p-6 space-y-2 md:space-y-4 flex-1">
                      <h3 className="text-sm md:text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{service.title}</h3>
                      <p className="text-[10px] md:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{service.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 md:pt-4 border-t gap-2">
                        <span className="text-xs md:text-lg font-black text-primary">
                          ৳{(service.basePrice || 0).toLocaleString()} 
                          <span className="text-[8px] md:text-[10px] ml-1 font-bold text-muted-foreground uppercase">Base</span>
                        </span>
                        <Button size="sm" className="rounded-full font-bold px-4 md:px-6 h-8 md:h-9 text-[10px] md:text-xs">Book Now</Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Products Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-3xl font-black font-headline text-[#081621]">Professional Tools</h2>
                <p className="text-muted-foreground">High-performance cleaning equipment and supplies.</p>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button variant="outline" className="gap-2 font-bold border-primary text-primary" asChild>
                    <Link href="/admin/products"><Plus size={16} /> Add Product</Link>
                  </Button>
                )}
                <Button variant="link" className="gap-2 font-bold" asChild>
                  <Link href="/products">Shop Catalog <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </PublicLayout>
  );
}
