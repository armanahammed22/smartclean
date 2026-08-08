
import type {Metadata, Viewport} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {LanguageProvider} from '@/components/providers/language-provider';
import {SupportProvider} from '@/components/providers/support-provider';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';
import {TrackingProvider} from '@/components/providers/tracking-provider';
import {LiveChatLoader} from '@/components/providers/live-chat-loader';
import {GlobalErrorBoundary} from '@/components/providers/error-boundary';
import { db } from '@/lib/firebaseAdmin';
import Script from 'next/script';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1E5F7A',
};

async function getGlobalSettings() {
  try {
    if (!db) return null;
    const snap = await db.collection('site_settings').doc('global').get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings();
  const baseUrl = settings?.websiteUrl ? settings.websiteUrl.replace(/\/$/, '') : 'https://smartclean.com.bd';
  
  const favicon = settings?.faviconUrl || settings?.logoUrl || '/favicon.ico';
  const appleIcon = settings?.appIconUrl || settings?.logoUrl || '/apple-icon.png';

  const verification: any = {};
  if (settings?.googleSearchConsoleToken) verification.google = settings.googleSearchConsoleToken;
  if (settings?.metaDomainVerification) {
    let fbToken = settings.metaDomainVerification.trim();
    const metaMatch = fbToken.match(/content=["']([^"']+)["']/);
    if (metaMatch && metaMatch[1]) fbToken = metaMatch[1];
    verification.other = { 'facebook-domain-verification': fbToken };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings?.seoTitle || 'Smart Clean | Best Professional Cleaning Services in Bangladesh',
      template: `%s | ${settings?.websiteName || 'Smart Clean'}`
    },
    description: settings?.seoDescription || 'Top-rated home and office cleaning and maintenance services in Dhaka.',
    icons: { icon: favicon, apple: appleIcon },
    openGraph: {
      type: 'website',
      siteName: settings?.websiteName || 'Smart Clean',
      images: [{ url: settings?.ogImage || 'https://picsum.photos/seed/smartclean-og/1200/630' }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getGlobalSettings();
  
  return (
    <html lang="bn" className="h-full bg-[#F8FAFC]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preload" href="/globals.css" as="style" />
      </head>
      <body className="font-body antialiased min-h-screen bg-[#F8FAFC]">
        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            <LanguageProvider>
              <SupportProvider>
                <CartProvider>
                  <TrackingProvider>
                    <LiveChatLoader />
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
        <SpeedInsights />
      </body>
    </html>
  );
}
