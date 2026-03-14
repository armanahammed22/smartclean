import type {Metadata} from 'next';
import './globals.css';
import {CartProvider} from '@/components/providers/cart-provider';
import {Navbar} from '@/components/layout/navbar';
import {Toaster} from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'QuickOrder | Modern E-commerce Solutions',
  description: 'Fast, efficient, and clean ordering experience.',
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
        <CartProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}