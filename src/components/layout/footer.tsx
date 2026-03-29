
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
    <footer className="border-t border-white/10 pt-6 md:pt-8 pb-4 mt-auto transition-colors duration-500" style={footerStyles}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-8 md:h-10 w-auto min-w-[80px] md:min-w-[100px] flex items-center justify-start overflow-hidden">
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
                <span className="text-base md:text-lg font-black tracking-tighter font-headline uppercase leading-none" style={headingStyles}>
                  {settings?.websiteName || 'SMART CLEAN'}
                </span>
                <span className="text-[6px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">Reliable Cleaning</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed max-w-xs opacity-80">
              {settings?.seoDescription || "Expert cleaning services for your home and office in Bangladesh."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              {(layout?.footer?.showSocial !== false) && (
                <div className="flex gap-2">
                  {settings?.socialLinks?.facebook && (
                    <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                      <Facebook size={14} />
                    </a>
                  )}
                  {settings?.socialLinks?.instagram && (
                    <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                      <Instagram size={14} />
                    </a>
                  )}
                  {settings?.socialLinks?.whatsapp && (
                    <a href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                      <MessageCircle size={14} />
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
                      "flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-all",
                      !settings?.playStoreLink && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Smartphone size={14} className="text-primary" />
                    <span className="text-[8px] font-black text-white uppercase">Play Store</span>
                  </a>
                  <a 
                    href={settings?.apkDownloadLink || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={cn(
                      "flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-all",
                      !settings?.apkDownloadLink && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Download size={14} className="text-primary" />
                    <span className="text-[8px] font-black text-white uppercase">Direct APK</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[9px] md:text-[10px] font-black mb-3 md:mb-4 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_services')}</h4>
            <ul className="space-y-2 text-[11px]">
              {layout?.footer?.serviceLinks?.map((item: any, i: number) => {
                const isProdLink = item.link === '/products';
                const isServLink = item.link === '/services';
                if (isProdLink && !productsEnabled) return null;
                if (isServLink && !servicesEnabled) return null;
                return <li key={i}><Link href={item.link} className="hover:text-primary transition-colors">{item.label}</Link></li>
              }) || (
                <>
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>}
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors">Office Cleaning</Link></li>}
                  {servicesEnabled && <li><Link href="/services" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>}
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] md:text-[10px] font-black mb-3 md:mb-4 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_company')}</h4>
            <ul className="space-y-2 text-[11px]">
              {layout?.footer?.companyLinks?.map((item: any, i: number) => (
                <li key={i}><Link href={item.link} className="hover:text-primary transition-colors">{item.label}</Link></li>
              )) || (
                <>
                  <li><Link href="/page/about-us" className="hover:text-primary transition-colors">{t('footer_about')}</Link></li>
                  <li><Link href="/page/privacy-policy" className="hover:text-primary transition-colors">{t('footer_privacy')}</Link></li>
                  <li><Link href="/page/terms-of-service" className="hover:text-primary transition-colors">{t('footer_terms')}</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] md:text-[10px] font-black mb-3 md:mb-4 text-primary uppercase tracking-[0.2em]" style={headingStyles}>{t('footer_contact')}</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{settings?.address || "Wireless Gate, Mohakhali, Dhaka-1212"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                <span>{settings?.contactPhone || '+8801919640422'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary shrink-0" />
                <span className="truncate">{settings?.contactEmail || 'smartclean422@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-medium opacity-50">
            {settings?.footerContent || "© 2026 Smart Clean Bangladesh. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
