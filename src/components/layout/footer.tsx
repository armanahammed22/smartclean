
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle,
  Facebook,
  Instagram,
  Smartphone,
  Download,
  Award,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function Footer() {
  const { t } = useLanguage();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const layoutRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'layout') : null, [db]);
  const { data: layout } = useDoc(layoutRef);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  const footerStyles = {
    backgroundColor: layout?.footer?.bgColor || '#050505',
    color: layout?.footer?.textColor || '#9ca3af'
  };

  const headingStyles = {
    color: layout?.footer?.headingColor || '#ffffff'
  };

  return (
    <footer className="border-t border-white/10 pt-16 pb-4 mt-auto transition-colors duration-500" style={footerStyles}>
      <div className="container mx-auto px-4">
        
        {/* 🚀 AFFILIATE PROMO BAR */}
        <section className="mb-16">
          <Card className="border-none shadow-2xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={160} className="text-primary" /></div>
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20"><TrendingUp size={24}/></div>
                    <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-3 py-1 rounded-lg text-[9px]">Passive Income</Badge>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Earn with Smart Clean</h3>
                  <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed">
                    Join our affiliate network and earn up to <span className="text-primary font-black">৳500 per booking</span> when your friends or followers book a professional cleaning service.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <Button asChild className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Link href="/account/affiliate">Join Program <ArrowRight className="ml-2" size={18}/></Link>
                  </Button>
                  <Button variant="outline" asChild className="h-16 px-10 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-black uppercase text-xs tracking-widest">
                    <Link href="/page/partnership-terms">Terms & Benefits</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 md:h-12 w-auto min-w-[100px] flex items-center justify-start overflow-hidden">
                {displayLogo ? (
                  <Image 
                    src={displayLogo} 
                    alt="Logo" 
                    fill
                    className="object-contain object-left" 
                    data-ai-hint="company logo"
                    unoptimized
                  />
                ) : (
                  <div className="bg-primary p-1.5 rounded-lg">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black tracking-tighter font-headline uppercase leading-none" style={headingStyles}>
                  {settings?.websiteName || 'SMART CLEAN'}
                </span>
                <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] mt-1">Professional Excellence</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs opacity-80">
              {settings?.seoDescription || "Expert cleaning services for your home and office in Bangladesh. We use modern tech for a spotless life."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              {(layout?.footer?.showSocial !== false) && (
                <div className="flex gap-2">
                  {settings?.socialLinks?.facebook && (
                    <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-xl hover:bg-primary transition-all text-gray-400 hover:text-white border border-white/5 shadow-inner">
                      <Facebook size={16} />
                    </a>
                  )}
                  {settings?.socialLinks?.instagram && (
                    <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-xl hover:bg-primary transition-all text-gray-400 hover:text-white border border-white/5 shadow-inner">
                      <Instagram size={16} />
                    </a>
                  )}
                  {settings?.socialLinks?.whatsapp && (
                    <a href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-xl hover:bg-primary transition-all text-gray-400 hover:text-white border border-white/5 shadow-inner">
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              )}

              {(layout?.footer?.showDownload !== false) && (
                <div className="flex gap-2">
                  <a 
                    href={settings?.playStoreLink || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={cn(
                      "flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-all",
                      !settings?.playStoreLink && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Smartphone size={16} className="text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-white/40 uppercase leading-none">GET IT ON</span>
                      <span className="text-[9px] font-black text-white uppercase leading-none mt-1">Play Store</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] md:text-[11px] font-black mb-6 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_services')}</h4>
            <ul className="space-y-3 text-sm">
              {layout?.footer?.serviceLinks?.map((item: any, i: number) => {
                const isProdLink = item.link === '/products';
                const isServLink = item.link === '/services';
                if (isProdLink && !productsEnabled) return null;
                if (isServLink && !servicesEnabled) return null;
                return <li key={i}><Link href={item.link} className="hover:text-primary transition-colors opacity-80 hover:opacity-100">{item.label}</Link></li>
              }) || (
                <>
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">Residential Cleaning</Link></li>}
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">Office Deep Cleaning</Link></li>}
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">Kitchen Sanitization</Link></li>}
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] md:text-[11px] font-black mb-6 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_company')}</h4>
            <ul className="space-y-3 text-sm">
              {layout?.footer?.companyLinks?.map((item: any, i: number) => (
                <li key={i}><Link href={item.link} className="hover:text-primary transition-colors opacity-80 hover:opacity-100">{item.label}</Link></li>
              )) || (
                <>
                  <li><Link href="/page/about-us" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">{t('footer_about')}</Link></li>
                  <li><Link href="/page/careers" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">Work with us</Link></li>
                  <li><Link href="/page/privacy-policy" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">{t('footer_privacy')}</Link></li>
                  <li><Link href="/page/terms-of-service" className="hover:text-primary transition-colors opacity-80 hover:opacity-100">{t('footer_terms')}</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] md:text-[11px] font-black mb-6 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_contact')}</h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-primary"><MapPin size={16} className="shrink-0" /></div>
                <span className="line-clamp-2 leading-relaxed opacity-80">{settings?.address || "Wireless Gate, Mohakhali, Dhaka-1212"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-primary"><Phone size={16} className="shrink-0" /></div>
                <span className="opacity-80 font-bold">{settings?.contactPhone || '+8801919640422'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-primary"><Mail size={16} className="shrink-0" /></div>
                <span className="truncate opacity-80">{settings?.contactEmail || 'smartclean422@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black opacity-30 italic">
            {settings?.footerContent || "© 2026 Smart Clean Bangladesh. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
