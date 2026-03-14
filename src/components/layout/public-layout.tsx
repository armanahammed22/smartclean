'use client';

import React from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { CheckoutModal } from '@/components/checkout/checkout-modal';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <CheckoutModal />
    </div>
  );
}
