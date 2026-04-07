import type {Metadata, Viewport} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {SupportProvider} from '@/components/providers/support-provider';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';
import {TrackingProvider} from '@/components/providers/tracking-provider';
import {GlobalErrorBoundary} from '@/components/providers/error-boundary';
import { db } from '@/lib/firebaseAdmin';
import Script from 'next/script';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1E5F7A',
};

/**
 * Server-side helper to fetch global settings for script injection
 */
async function getGlobalSettings() {
  try {
    if (!db) return null;
    const snap = await db.collection('site_settings').doc('global').get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

/**
 * Generate Dynamic Metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings();
  const baseUrl = settings?.websiteUrl ? settings.websiteUrl.replace(/\/$/, '') : 'https://smartclean.com.bd';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings?.seoTitle || 'Smart Clean | Best Professional Cleaning Services in Bangladesh',
      template: `%s | ${settings?.websiteName || 'Smart Clean'}`
    },
    description: settings?.seoDescription || 'Top-rated home and office cleaning, AC maintenance, and appliance repair services in Dhaka.',
    keywords: settings?.seoKeywords?.split(',') || ['cleaning services dhaka', 'home cleaning bangladesh'],
    authors: [{ name: 'Smart Clean Team' }],
    creator: 'Smart Clean',
    publisher: 'Smart Clean Bangladesh',
    verification: {
      google: settings?.googleSearchConsoleToken,
    },
    icons: {
      icon: settings?.faviconUrl || '/favicon.ico',
      shortcut: settings?.faviconUrl || '/favicon.ico',
      apple: settings?.appIconUrl || '/apple-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      url: baseUrl,
      siteName: settings?.websiteName || 'Smart Clean',
      title: settings?.seoTitle || 'Smart Clean | Professional Cleaning & Maintenance',
      description: settings?.seoDescription,
      images: [
        {
          url: settings?.ogImage || 'https://picsum.photos/seed/smartclean-og/1200/630',
          width: 1200,
          height: 630,
          alt: 'Smart Clean Bangladesh',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings?.seoTitle,
      description: settings?.seoDescription,
      images: [settings?.ogImage || 'https://picsum.photos/seed/smartclean-og/1200/630'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getGlobalSettings();

  // Helper to clean scripts for next/script
  const cleanScript = (script: string) => {
    if (!script) return '';
    return script
      .replace(/<script[^>]*>/gi, '')
      .replace(/<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  };

  return (
    <html lang="bn" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: settings?.websiteName || 'Smart Clean Bangladesh',
              url: settings?.websiteUrl || 'https://smartclean.com.bd',
              logo: settings?.logoUrl || 'https://picsum.photos/seed/smartclean-logo/512/512',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: settings?.contactPhone || '+8801919640422',
                contactType: 'customer service',
                areaServed: 'BD',
                availableLanguage: ['Bengali', 'English']
              }
            })
          }}
        />
      </head>
      <body className="font-body antialiased min-h-screen">
        {/* Google Tag Manager (Body Script) - Immediate injection */}
        {settings?.gtmBodyScript && (
          <div
            id="gtm-body-noscript"
            dangerouslySetInnerHTML={{
              __html: settings.gtmBodyScript,
            }}
          />
        )}

        {/* Google Tag Manager (Head Script) - Optimized loading */}
        {settings?.gtmHeadScript && (
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: cleanScript(settings.gtmHeadScript),
            }}
          />
        )}

        {/* Google Analytics (Direct injection if GTM is not used) */}
        {!settings?.gtmHeadScript && settings?.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `}
            </Script>
          </>
        )}

        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            <LanguageProvider>
              <SupportProvider>
                <CartProvider>
                  <TrackingProvider>
                    <main className="flex flex-col min-h-screen">
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
