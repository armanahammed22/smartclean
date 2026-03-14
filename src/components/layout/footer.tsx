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
    <footer className="bg-[#050505] text-white pt-16 pb-8 border-t border-white/5">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Brand Section - Stacked */}
        <div className="mb-12 flex flex-col items-center max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden shadow-lg shadow-primary/20">
              {LOGO_IMAGE ? (
                <Image 
                  src={LOGO_IMAGE.imageUrl} 
                  alt="Smart Clean Logo" 
                  fill 
                  className="object-contain p-1"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-2xl text-white font-headline">S</div>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black leading-none tracking-tighter font-headline">SMART CLEAN</h3>
              <span className="text-primary text-sm font-bold tracking-widest uppercase">Bangladesh</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            The most trusted name for professional cleaning & maintenance services across Bangladesh. 
            Providing fast, efficient, and intelligent solutions for over 1000+ satisfied clients.
          </p>
          
          {/* Integrated WhatsApp Button (No longer floating) */}
          <Link 
            href="https://wa.me/8801919640422" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-[#25D366]/20 mb-10"
          >
            <MessageCircle size={24} className="fill-white text-[#25D366]" />
            Chat with an Expert on WhatsApp
          </Link>
        </div>

        {/* Links & Contact - Stacked Columns on Mobile, Grid on Desktop but centered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl mb-16">
          {/* Services Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-lg mb-6 uppercase tracking-wider">Services</h4>
            <ul className="space-y-3">
              {["Home Cleaning", "Deep Cleaning", "AC Service", "Pest Control", "Upholstery"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 group">
                    <ChevronRight size={12} className="text-primary group-hover:translate-x-1 transition-transform" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-lg mb-6 uppercase tracking-wider">Connect</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="text-primary shrink-0" size={20} />
                <span className="max-w-[250px]">GP.JA-66/2, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-primary shrink-0" size={18} />
                <span className="font-bold text-white">+8801919640422</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-primary shrink-0" size={18} />
                <span>smartclean422@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Availability Stack */}
          <div className="flex flex-col items-center">
            <h4 className="text-primary font-bold text-lg mb-6 uppercase tracking-wider">Business Hours</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex flex-col items-center gap-1">
                <Clock className="text-primary shrink-0" size={20} />
                <span className="text-white font-medium">Sat - Thu: 8am - 8pm</span>
                <span>Friday: 10am - 6pm</span>
              </div>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8 py-6 shadow-lg shadow-primary/20">
                Request Free Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Stacked */}
        <div className="border-t border-white/5 pt-10 w-full flex flex-col items-center gap-6">
          <div className="flex gap-8 text-xs text-gray-500 font-medium">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
          <p className="text-gray-600 text-[11px] font-medium tracking-widest uppercase">
            © {currentYear} Smart Clean Bangladesh. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
