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
    <footer className="bg-[#050505] text-white pt-10 pb-6 border-t border-white/5">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Brand Section - Stacked */}
        <div className="mb-8 flex flex-col items-center max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden shadow-lg shadow-primary/20">
              {LOGO_IMAGE ? (
                <Image 
                  src={LOGO_IMAGE.imageUrl} 
                  alt="Smart Clean Logo" 
                  fill 
                  className="object-contain p-1"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-xl text-white font-headline">S</div>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black leading-none tracking-tighter font-headline text-white">SMART CLEAN</h3>
              <span className="text-primary text-xs font-bold tracking-widest uppercase">Bangladesh</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            The most trusted name for professional cleaning & maintenance services across Bangladesh. 
            Trusted by 1000+ satisfied clients.
          </p>
          
          <Link 
            href="https://wa.me/8801919640422" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-bold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-[#25D366]/20 mb-6"
          >
            <MessageCircle size={20} className="fill-white text-[#25D366]" />
            WhatsApp Expert
          </Link>
        </div>

        {/* Links & Contact - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-10">
          {/* Services Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-sm mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-2">
              {["Home Cleaning", "Deep Cleaning", "AC Service", "Pest Control", "Upholstery"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs flex items-center justify-center gap-2 group">
                    <ChevronRight size={10} className="text-primary group-hover:translate-x-1 transition-transform" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-sm mb-4 uppercase tracking-wider">Connect</h4>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex flex-col items-center gap-1">
                <MapPin className="text-primary shrink-0" size={16} />
                <span className="max-w-[220px]">GP.JA-66/2, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-primary shrink-0" size={14} />
                <span className="font-bold text-white">+8801919640422</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-primary shrink-0" size={14} />
                <span>smartclean422@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Availability Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-sm mb-4 uppercase tracking-wider">Business Hours</h4>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex flex-col items-center gap-1">
                <Clock className="text-primary shrink-0" size={16} />
                <span className="text-white font-medium">Sat - Thu: 8am - 8pm</span>
                <span>Friday: 10am - 6pm</span>
              </div>
              <Button size="sm" className="mt-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-lg shadow-primary/20 h-9">
                Request Free Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Stacked */}
        <div className="border-t border-white/5 pt-6 w-full flex flex-col items-center gap-4">
          <div className="flex gap-6 text-[10px] text-gray-500 font-medium">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
          <p className="text-gray-600 text-[10px] font-medium tracking-widest uppercase">
            © {currentYear} Smart Clean Bangladesh.
          </p>
        </div>
      </div>
    </footer>
  );
}
