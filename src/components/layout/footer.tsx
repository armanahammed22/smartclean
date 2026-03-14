"use client";

import Link from 'next/link';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-white border-t border-white/10 py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-4 max-w-4xl">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-black tracking-tighter font-headline text-white">SMART CLEAN</h3>
          <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">Bangladesh</p>
          <p className="text-gray-400 text-xs mt-2 max-w-sm">
            The most trusted name for professional cleaning and maintenance services.
          </p>
        </div>

        {/* Compact Contact Row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-gray-300 font-medium">
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
            <Phone size={14} className="text-primary" />
            <span>+8801919640422</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
            <Mail size={14} className="text-primary" />
            <span>smartclean422@gmail.com</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
            <MapPin size={14} className="text-primary" />
            <span>Mohakhali, Dhaka-1212</span>
          </div>
        </div>

        {/* Action Link */}
        <Link 
          href="https://wa.me/8801919640422" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-[#25D366]/10"
        >
          <MessageCircle size={16} className="fill-white text-[#25D366]" />
          WhatsApp Expert
        </Link>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-[9px] font-medium tracking-widest uppercase">
            © {currentYear} Smart Clean Bangladesh.
          </p>
          <div className="flex gap-4 text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
