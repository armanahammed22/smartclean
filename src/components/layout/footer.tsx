"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 pt-10 pb-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                {LOGO_IMAGE ? (
                  <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain p-1" />
                ) : (
                  <span className="text-primary font-bold">S</span>
                )}
              </div>
              <span className="text-lg font-black tracking-tighter font-headline">SMART CLEAN</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
              The most trusted name for professional cleaning and maintenance services in Bangladesh.
            </p>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">Residential Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Office Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Deep Cleaning</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Upholstery Care</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">Contact Us</h4>
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
              <span>Mohakhali, Dhaka-1212, Bangladesh</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone size={14} className="text-primary shrink-0" />
              <span>+8801919640422</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mail size={14} className="text-primary shrink-0" />
              <span>smartclean422@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <Clock size={14} className="text-primary shrink-0" />
              <span>Sat - Thu: 8am - 8pm</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">
            © {currentYear} Smart Clean Bangladesh. All rights reserved.
          </p>
          <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refunds</Link>
            <Link href="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
