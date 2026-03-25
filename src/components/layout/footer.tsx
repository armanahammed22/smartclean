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
  Download
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Footer() {
  const { t } = useLanguage();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 pt-12 md:pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 md:h-12 w-auto min-w-[100px] md:min-w-[120px] max-w-[200px] flex items-center justify-start overflow-hidden">
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
                  <div className="bg-primary p-2 rounded-lg">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black tracking-tighter font-headline uppercase leading-none">
                  {settings?.websiteName || 'SMART CLEAN'}
                </span>
                <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] mt-1">Reliable Cleaning</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings?.seoDescription || "Expert cleaning services for your home and office in Bangladesh."}
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 pt-2">
                {settings?.socialLinks?.facebook && (
                  <Link href={settings.socialLinks.facebook} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                    <Facebook size={18} />
                  </Link>
                )}
                {settings?.socialLinks?.instagram && (
                  <Link href={settings.socialLinks.instagram} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                    <Instagram size={18} />
                  </Link>
                )}
                {settings?.socialLinks?.whatsapp && (
                  <Link href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                    <MessageCircle size={18} />
                  </Link>
                )}
              </div>

              {/* 📱 Customer App Download Section - Moved Here */}
              <div className="pt-2">
                <h4 className="text-[10px] md:text-xs font-black mb-4 text-primary uppercase tracking-[0.2em]">Download App</h4>
                <div className="flex flex-col gap-2">
                  <Link href="#" className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group max-w-[180px]">
                    <div className="p-1.5 bg-white/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                      <Smartphone size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] font-bold text-gray-500 uppercase leading-none">Customer App</p>
                      <p className="text-[10px] font-black text-white uppercase mt-1">Get on Android</p>
                    </div>
                  </Link>
                  <Link href="#" className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group max-w-[180px]">
                    <div className="p-1.5 bg-white/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                      <Download size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] font-bold text-gray-500 uppercase leading-none">Customer App</p>
                      <p className="text-[10px] font-black text-white uppercase mt-1">Get on iOS</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] md:text-xs font-black mb-6 md:mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_services')}</h4>
            <ul className="space-y-3 md:space-y-4 text-[13px] text-gray-400">
              <li><Link href="/services" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Sanitization Equipment</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Cleaning Supplies</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-[10px] md:text-xs font-black mb-6 md:mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_company')}</h4>
              <ul className="space-y-3 md:space-y-4 text-[13px] text-gray-400">
                <li><Link href="/page/about-us" className="hover:text-primary transition-colors">{t('footer_about')}</Link></li>
                <li><Link href="/page/privacy-policy" className="hover:text-primary transition-colors">{t('footer_privacy')}</Link></li>
                <li><Link href="/page/terms-of-service" className="hover:text-primary transition-colors">{t('footer_terms')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] md:text-xs font-black mb-6 md:mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_contact')}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[13px] text-gray-400">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span>{settings?.address || "Wireless Gate, Mohakhali, Dhaka-1212"}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-gray-400">
                <Phone size={18} className="text-primary shrink-0" />
                <span>{settings?.contactPhone || '+8801919640422'}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-gray-400">
                <Mail size={18} className="text-primary shrink-0" />
                <span>{settings?.contactEmail || 'smartclean422@gmail.com'}</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-gray-400">
                <Clock size={18} className="text-primary shrink-0 mt-0.5" />
                <span>Sat-Thu, 8AM - 8PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <p className="text-gray-500 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-medium text-center">
            {settings?.footerContent || "© 2026 Smart Clean Bangladesh. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}