'use client';

import React, { useEffect } from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { WhatsAppContact } from './whatsapp-contact';
import { CheckoutModal } from '@/components/checkout/checkout-modal';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Sync Dynamic Title, Favicon and Meta Tags
  useEffect(() => {
    if (settings) {
      // 1. Update Document Title
      if (settings.seoTitle) {
        document.title = settings.seoTitle;
      } else if (settings.websiteName) {
        document.title = `${settings.websiteName} | Professional Cleaning`;
      }

      // 2. Update Favicon
      if (settings.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.faviconUrl;
      }

      // 3. Update Meta Description
      if (settings.seoDescription) {
        let metaDesc: HTMLMetaElement | null = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.getElementsByTagName('head')[0].appendChild(metaDesc);
        }
        metaDesc.content = settings.seoDescription;
      }
    }
  }, [settings]);

  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppContact />
      <CheckoutModal />
    </div>
  );
}
