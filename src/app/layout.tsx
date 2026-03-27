
import type {Metadata, Viewport} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {SupportProvider} from '@/components/providers/support-provider';
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
  metadataBase: new URL('https://smartclean.com.bd'), // Update with actual domain
  title: {
    default: 'Smart Clean | Best Professional Cleaning Services in Bangladesh',
    template: '%s | Smart Clean Bangladesh'
  },
  description: 'Top-rated home and office cleaning, AC maintenance, and appliance repair services in Dhaka. Professional teams, affordable pricing, and 100% satisfaction guaranteed.',
  keywords: ['cleaning services dhaka', 'home cleaning bangladesh', 'office cleaning', 'ac repair dhaka', 'deep cleaning service', 'smart clean'],
  authors: [{ name: 'Smart Clean Team' }],
  creator: 'Smart Clean',
  publisher: 'Smart Clean Bangladesh',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: 'https://smartclean.com.bd',
    siteName: 'Smart Clean',
    title: 'Smart Clean | Professional Cleaning & Maintenance',
    description: 'The smartest way to keep your space spotless. Book verified professionals for home and office cleaning.',
    images: [
      {
        url: 'https://picsum.photos/seed/smartclean-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'Smart Clean Bangladesh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Clean | Professional Cleaning Services',
    description: 'Expert cleaning and maintenance services in Bangladesh.',
    images: ['https://picsum.photos/seed/smartclean-og/1200/630'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Smart Clean Bangladesh',
              url: 'https://smartclean.com.bd',
              logo: 'https://picsum.photos/seed/smartclean-logo/512/512',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+8801919640422',
                contactType: 'customer service',
                areaServed: 'BD',
                availableLanguage: ['Bengali', 'English']
              },
              sameAs: [
                'https://www.facebook.com/smartclean',
                'https://www.instagram.com/smartclean'
              ]
            })
          }}
        />
      </head>
      <body className="font-body antialiased h-full">
        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            <LanguageProvider>
              <SupportProvider>
                <CartProvider>
                  <TrackingProvider>
                    <main className="flex-1 flex flex-col h-full overflow-hidden">
                      {children}
                    </main>
                    <Toaster />
                  </TrackingProvider>
                </CartProvider>
              </SupportProvider>
            </LanguageProvider>
          </FirebaseClientProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
