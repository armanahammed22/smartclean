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
  Linkedin,
  Twitter
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
    <footer className="bg-[#050505] text-white border-t border-white/10 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/5">
                {displayLogo ? (
                  <Image src={displayLogo} alt="Logo" fill className="object-contain p-1.5" />
                ) : (
                  <span className="text-primary font-bold text-2xl">S</span>
                )}
              </div>
              <span className="text-2xl font-black tracking-tighter font-headline uppercase">
                {settings?.websiteName || 'SMART CLEAN'}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings?.seoDescription || t('footer_desc')}
            </p>
            
            {/* Social Media Links */}
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
              {settings?.socialLinks?.linkedin && (
                <Link href={settings.socialLinks.linkedin} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                  <Linkedin size={18} />
                </Link>
              )}
              {settings?.socialLinks?.whatsapp && (
                <Link href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-primary transition-all text-gray-400 hover:text-white">
                  <MessageCircle size={18} />
                </Link>
              )}
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-xs font-black mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_services')}</h4>
            <ul className="space-y-4 text-[13px] text-gray-400">
              <li><Link href="/services" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Sanitization Equipment</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Cleaning Supplies</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-black mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_company')}</h4>
            <ul className="space-y-4 text-[13px] text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">{t('footer_about')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('footer_careers')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('footer_privacy')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('footer_terms')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('footer_refund')}</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-6">
            <h4 className="text-xs font-black mb-8 text-primary uppercase tracking-[0.2em]">{t('footer_contact')}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[13px] text-gray-400">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span>{settings?.address || t('footer_address')}</span>
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
                <span>{t('footer_hours')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-medium text-center md:text-left">
            {settings?.footerContent || t('footer_rights')}
          </p>
          
          <Link 
            href={`https://wa.me/${settings?.contactPhone?.replace(/\D/g, '') || '8801919640422'}`} 
            className="flex items-center gap-3 bg-[#25D366] text-white px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_8px_20px_rgba(37,211,102,0.3)] font-bold text-sm"
            target="_blank"
          >
            <MessageCircle size={22} fill="white" />
            <span>{t('chat_wa')}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
