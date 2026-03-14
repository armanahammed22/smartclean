"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || 'UNKNOWN';

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <CheckCircle2 size={64} className="text-green-600" />
      </div>
      <h1 className="text-4xl font-extrabold font-headline mb-4 tracking-tight">Order Confirmed!</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-lg">
        Thank you for your purchase. Your order has been received and is being processed.
      </p>
      
      <div className="bg-muted p-6 rounded-xl border mb-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2 text-primary">
          <Package size={20} />
          <span className="font-bold">Order ID</span>
        </div>
        <p className="text-2xl font-mono font-bold">{orderId}</p>
        <p className="text-xs text-muted-foreground mt-4">
          A confirmation email has been sent to your inbox.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to Shop</Link>
        </Button>
        <Button asChild size="lg" className="gap-2">
          <Link href="/">
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </div>
  );
}