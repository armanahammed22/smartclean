"use client";

import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-white pt-16 pb-8 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-white rounded-md overflow-hidden">
                {LOGO_IMAGE ? (
                  <Image 
                    src={LOGO_IMAGE.imageUrl} 
                    alt="Smart Clean Logo" 
                    fill 
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-xl text-white">S</div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold leading-none">Smart Clean</h3>
                <span className="text-primary text-sm font-medium">Bangladesh</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Professional cleaning & maintenance services across Bangladesh. Trusted by 1000+ happy customers.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <span className="font-bold text-xs">FB</span>
              </Link>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="text-primary font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-4">
              {["Home Cleaning", "Deep Cleaning", "AC Service", "Pest Control", "Plumbing", "Electrical"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <ChevronRight size={12} className="text-primary" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="text-primary font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              {["Home", "Services", "Pricing", "Corporate", "Franchise", "About", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h4 className="text-primary font-bold text-lg mb-2">Contact</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex gap-3">
                <MapPin className="text-primary shrink-0" size={18} />
                <span>GP.JA-66/2, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212</span>
              </div>
              <div className="flex gap-3">
                <Phone className="text-primary shrink-0" size={18} />
                <span>+8801919640422</span>
              </div>
              <div className="flex gap-3">
                <Mail className="text-primary shrink-0" size={18} />
                <span>smartclean422@gmail.com</span>
              </div>
              <div className="flex gap-3">
                <Clock className="text-primary shrink-0" size={18} />
                <span>Sat-Thu: 8am-8pm, Fri: 10am-6pm</span>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full py-6">
              Get a Quote
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs text-center md:text-left">
            © {currentYear} Smart Clean Bangladesh. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Service</Link>
            <Link href="#" className="hover:text-white">Refund Policy</Link>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <Link 
          href="https://wa.me/8801919640422" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl shadow-[#25D366]/40 transition-all hover:scale-110 active:scale-95 group"
        >
          <MessageCircle size={32} className="fill-white text-[#25D366]" />
        </Link>
      </div>
    </footer>
  );
}
