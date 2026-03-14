"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 pt-12 pb-6 mt-auto">
      <div className="container mx-auto px-4">
        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                {LOGO_IMAGE ? (
                  <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain p-1" />
                ) : (
                  <span className="text-primary font-bold text-xl">S</span>
                )}
              </div>
              <span className="text-2xl font-black tracking-tighter font-headline uppercase">SMART CLEAN</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('footer_desc')}
            </p>
          </div>

          {/* Column 2: Services & Products */}
          <div>
            <h4 className="text-xs font-black mb-6 text-primary uppercase tracking-[0.2em]">{t('footer_services')}</h4>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Sanitization Kit</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Equipment Sales</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-black mb-6 text-primary uppercase tracking-[0.2em]">{t('footer_company')}</h4>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-black mb-6 text-primary uppercase tracking-[0.2em]">{t('footer_contact')}</h4>
            <div className="flex items-start gap-3 text-[13px] text-gray-400">
              <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
              <span>{t('footer_address')}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-gray-400">
              <Phone size={16} className="text-primary shrink-0" />
              <span>+8801919640422</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-gray-400">
              <Mail size={16} className="text-primary shrink-0" />
              <span>smartclean422@gmail.com</span>
            </div>
            <div className="flex items-start gap-3 text-[13px] text-gray-400">
              <Clock size={16} className="text-primary shrink-0 mt-0.5" />
              <span>{t('footer_hours')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Centered */}
        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-medium text-center">
            {t('footer_rights')}
          </p>
          
          {/* Static WhatsApp Button Style */}
          <Link 
            href="https://wa.me/8801919640422" 
            className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-lg font-bold"
            target="_blank"
          >
            <MessageCircle size={24} fill="white" />
            <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ করুন' : 'Chat via WhatsApp'}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
