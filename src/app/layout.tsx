import type {Metadata, Viewport} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';
import {TrackingProvider} from '@/components/providers/tracking-provider';
import {GlobalErrorBoundary} from '@/components/providers/error-boundary';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1E5F7A',
};

export const metadata: Metadata = {
  title: 'Smart Clean | Smart Service App',
  description: 'Professional cleaning and maintenance app for Bangladesh.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Smart Clean',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/smartclean-logo/192/192" />
      </head>
      <body className="font-body antialiased h-full">
        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            <LanguageProvider>
              <CartProvider>
                <TrackingProvider>
                  <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {children}
                  </main>
                  <Toaster />
                </TrackingProvider>
              </CartProvider>
            </LanguageProvider>
          </FirebaseClientProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
