
import type {Metadata, Viewport} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

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
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <LanguageProvider>
            <CartProvider>
              <main className="flex-1 flex flex-col">
                {children}
              </main>
              <Toaster />
            </CartProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
