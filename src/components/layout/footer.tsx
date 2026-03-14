"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 py-10 mt-auto">
      <div className="container mx-auto px-4">
        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                {LOGO_IMAGE ? (
                  <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain p-1" />
                ) : (
                  <span className="text-primary font-bold text-lg">S</span>
                )}
              </div>
              <span className="text-xl font-black tracking-tighter font-headline uppercase">SMART CLEAN</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer_desc')}
            </p>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">{t('footer_services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Sanitization</Link></li>
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">{t('footer_company')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">{t('footer_contact')}</h4>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin size={16} className="text-primary shrink-0 mt-1" />
              <span>{t('footer_address')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone size={16} className="text-primary shrink-0" />
              <span>+8801919640422</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail size={16} className="text-primary shrink-0" />
              <span>smartclean422@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock size={16} className="text-primary shrink-0" />
              <span>{t('footer_hours')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            {t('footer_rights')}
          </p>
          <div className="flex gap-6 text-xs text-gray-500 uppercase font-bold tracking-widest">
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refunds</Link>
            <Link href="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
