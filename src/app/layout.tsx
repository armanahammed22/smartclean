import type {Metadata} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {Navbar} from '@/components/layout/navbar';
import {Footer} from '@/components/layout/footer';
import {Toaster} from '@/components/ui/toaster';
import {CheckoutModal} from '@/components/checkout/checkout-modal';
import {BottomNav} from '@/components/layout/bottom-nav';

export const metadata: Metadata = {
  title: 'Smart Clean | Professional Cleaning Services in Bangladesh',
  description: 'Fast, efficient, and intelligent cleaning solutions for home and office in Bangladesh. Trusted by 1000+ customers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col pb-16 lg:pb-0">
        <LanguageProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <BottomNav />
            <CheckoutModal />
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
