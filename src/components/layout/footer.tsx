"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 py-6 mt-auto">
      <div className="container mx-auto px-4">
        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Column 1: Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                {LOGO_IMAGE ? (
                  <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain p-1" />
                ) : (
                  <span className="text-primary font-bold text-sm">S</span>
                )}
              </div>
              <span className="text-md font-black tracking-tighter font-headline">SMART CLEAN</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-tight max-w-xs">
              The most trusted name for professional cleaning services across Bangladesh. Trusted by 1000+ satisfied clients.
            </p>
          </div>

          {/* Column 2: Services & Products */}
          <div>
            <h4 className="text-[11px] font-bold mb-2 text-primary uppercase tracking-wider">Services</h4>
            <ul className="space-y-1 text-[11px] text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Pest Control</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-[11px] font-bold mb-2 text-primary uppercase tracking-wider">Company</h4>
            <ul className="space-y-1 text-[11px] text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold mb-2 text-primary uppercase tracking-wider">Contact Us</h4>
            <div className="flex items-start gap-1 text-[10px] text-gray-400">
              <MapPin size={10} className="text-primary shrink-0 mt-0.5" />
              <span>Wireless Gate, Mohakhali, Dhaka-1212</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Phone size={10} className="text-primary shrink-0" />
              <span>+8801919640422</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Mail size={10} className="text-primary shrink-0" />
              <span>smartclean422@gmail.com</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock size={10} className="text-primary shrink-0" />
              <span>Sat - Thu: 8am - 8pm</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-[9px] uppercase">
            © {currentYear} Smart Clean Bangladesh. All rights reserved.
          </p>
          <div className="flex gap-3 text-[9px] text-gray-500 uppercase tracking-tighter">
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refunds</Link>
            <Link href="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}