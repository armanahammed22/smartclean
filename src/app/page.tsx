'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { 
  ArrowRight, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  ShoppingCart,
  Zap,
  LayoutGrid,
  Flashlight,
  Timer,
  Search,
  X,
  Package,
  ChevronDown
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { useCart } from '@/components/providers/cart-provider';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { CampaignSection } from '@/components/campaigns/campaign-section';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Search State for Home Page
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // 🛡️ Optimized Production-Safe Queries
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);

  const { data: allBanners, isLoading: bannersLoading } = useCollection(bannersRef);
  const { data: allTopNav, isLoading: topNavLoading } = useCollection(topNavRef);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsRef);
  const { data: allServices, isLoading: servicesLoading } = useCollection(servicesRef);

  const mainBanners = useMemo(() => allBanners?.filter(b => b.isActive && (b.type === 'main' || !b.type)).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const featuredProducts = useMemo(() => allProducts?.filter(p => p.status === 'Active').sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)).slice(0, 6) || [], [allProducts]);
  const latestProducts = useMemo(() => allProducts?.filter(p => p.status === 'Active').sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) || [], [allProducts]);
  const activeServices = useMemo(() => allServices?.filter(s => s.status === 'Active').slice(0, 8) || [], [allServices]);

  const categoryChunks = useMemo(() => {
    if (!allTopNav) return [];
    const sorted = [...allTopNav].sort((a, b) => (a.order || 0) - (b.order || 0));
    const chunks = [];
    for (let i = 0; i < sorted.length; i += 8) chunks.push(sorted.slice(i, i + 8));
    return chunks;
  }, [allTopNav]);

  // Home Page Live Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const combined = [
      ...(allProducts?.map(p => ({ ...p, type: 'product' })) || []),
      ...(allServices?.map(s => ({ ...s, type: 'service' })) || [])
    ];
    return combined.filter(item => 
      (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery, allProducts, allServices]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
        
        {/* 📱 APP HERO SLIDER */}
        <section className="bg-white pb-4 shadow-sm lg:shadow-none lg:bg-transparent lg:mt-4">
          <div className="container mx-auto px-0 lg:px-4">
            <div className="relative aspect-[21/11] md:aspect-[982/400] w-full lg:rounded-2xl overflow-hidden bg-gray-100">
              {bannersLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : mainBanners.length > 0 ? (
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full -ml-0">
                    {mainBanners.map((banner) => (
                      <CarouselItem key={banner.id} className="h-full basis-full relative pl-0">
                        <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                          <Image src={banner.imageUrl || ''} alt={banner.title} fill className="object-cover" priority unoptimized />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-center p-6 md:p-12">
                            <h2 className="text-white text-xl md:text-4xl font-black uppercase tracking-tight mb-1 drop-shadow-md">{banner.title}</h2>
                            <p className="text-white/90 text-[10px] md:text-lg font-medium mb-4 max-w-[180px] md:max-w-md line-clamp-2">{banner.subtitle}</p>
                            <Button size="sm" className="w-fit h-8 md:h-10 rounded-full px-6 font-black uppercase text-[9px]" style={{ backgroundColor: banner.buttonColor }}>
                              {banner.buttonText || 'Discover'}
                            </Button>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : null}
            </div>
          </div>
        </section>

        {/* 🔍 HOME PAGE PROMINENT SEARCH */}
        <section className="px-4 -mt-6 md:-mt-8 relative z-20">
          <div className="max-w-3xl mx-auto" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary z-10 flex items-center gap-2 pointer-events-none">
                <Search size={22} />
              </div>
              <Input 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full h-14 md:h-16 pl-14 pr-16 rounded-2xl md:rounded-[1.5rem] border-none shadow-2xl bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-base md:text-lg"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 md:h-12 w-10 md:w-12 bg-primary flex items-center justify-center rounded-xl md:rounded-2xl text-white hover:bg-primary/90 transition-all active:scale-90"
              >
                <Search size={20} />
              </button>
            </form>

            {isSearchFocused && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 bg-gray-50/50 border-b flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Suggestions for you</span>
                  <button onClick={() => setIsSearchFocused(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                          router.push(`/${item.type === 'product' ? 'product' : 'service'}/${item.id}`);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-all border-b border-gray-50 last:border-none text-left group"
                      >
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border shrink-0">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt="Result" fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/20">
                              {item.type === 'service' ? <Wrench size={24} /> : <Package size={24} />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 uppercase truncate group-hover:text-primary transition-colors">{item.name || item.title}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase px-2 h-4 border-none shadow-sm",
                              item.type === 'service' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                            )}>
                              {item.type}
                            </Badge>
                            <span className="text-sm font-black text-primary tracking-tighter">৳{(item.price || item.basePrice)?.toLocaleString()}</span>
                          </div>
                        </div>
                        <ChevronDown size={16} className="-rotate-90 text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 border border-dashed border-gray-200"><Search size={32} /></div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">No results for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <Link 
                    href={`/services?search=${searchQuery}`}
                    onClick={() => setIsSearchFocused(false)}
                    className="block p-4 bg-primary text-white text-center text-xs font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all"
                  >
                    See all results <ArrowRight size={14} className="inline ml-2" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 📱 APP QUICK CATEGORIES */}
        <section className="px-4 py-10">
          <div className="app-card p-4 md:p-6">
            {topNavLoading ? (
              <div className="grid grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => <div key={i} className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-gray-50 animate-pulse" /><div className="w-10 h-2 bg-gray-50 rounded animate-pulse" /></div>)}
              </div>
            ) : categoryChunks.length > 0 ? (
              <Carousel setApi={setApi} className="w-full">
                <CarouselContent className="-ml-0">
                  {categoryChunks.map((chunk, chunkIdx) => (
                    <CarouselItem key={chunkIdx} className="pl-0 basis-full">
                      <div className="grid grid-cols-4 grid-rows-2 gap-y-6 gap-x-4">
                        {chunk.map((cat) => (
                          <Link key={cat.id} href={cat.link || `/services?category=${cat.name}`} className="flex flex-col items-center gap-2 group app-button">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center p-3 border border-gray-50 shadow-sm group-hover:bg-primary/10">
                              {cat.imageUrl ? <div className="relative w-full h-full"><Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" unoptimized /></div> : <LayoutGrid size={20} className="text-gray-400" />}
                            </div>
                            <span className="text-[9px] font-black text-center text-gray-600 uppercase tracking-tighter truncate w-full">{cat.name}</span>
                          </Link>
                        ))}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : null}
          </div>
        </section>

        <CampaignSection />

        {/* 📱 APP FLASH DEALS - Optimized for 3 Products on Mobile */}
        <section className="px-4 py-2">
          <div className="app-card border-none bg-primary text-white shadow-xl shadow-primary/10">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-accent p-1.5 rounded-lg text-white">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight italic leading-none">Flash Sale</h2>
                  <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-1">Limited Time Only</p>
                </div>
                <div className="flex gap-1 ml-4">
                  {['02', '14', '55'].map((t, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="bg-white text-primary text-[10px] font-black px-2 py-0.5 rounded shadow-lg min-w-[24px] text-center"> {t} </span>
                      {i < 2 && <span className="text-[10px] font-black opacity-60">:</span>}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/products" className="text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full transition-all">
                View All <ChevronRight size={12} />
              </Link>
            </div>
            <div className="p-3 md:p-6">
              <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="w-[calc(33.33%-8px)] md:w-[180px] shrink-0">
                    <ProductCard product={product} isDark={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 📱 APP SERVICES GRID */}
        <section className="px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-2">
              <Wrench className="text-primary" size={20} /> Pro Services
            </h2>
            <Link href="/services" className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">All <ChevronRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {activeServices.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`} className="app-card group relative aspect-[4/3] block active:scale-95 transition-transform">
                <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                  <h3 className="text-white font-black uppercase text-[10px] leading-tight mb-1">{service.title}</h3>
                  <p className="text-primary font-black text-xs">৳{service.basePrice?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 📱 APP PRODUCT FEED */}
        <section className="px-4 py-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-2">
              <Sparkles className="text-accent" size={20} fill="currentColor" /> Just For You
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}