"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || 'UNKNOWN';
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <CheckCircle2 size={64} className="text-green-600" />
      </div>
      <h1 className="text-4xl font-extrabold font-headline mb-4 tracking-tight">{t('order_confirmed')}</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-lg">
        {t('thank_you_order')}
      </p>
      
      <div className="bg-muted p-6 rounded-xl border mb-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2 text-primary">
          <Package size={20} />
          <span className="font-bold">{t('order_id')}</span>
        </div>
        <p className="text-2xl font-mono font-bold">{orderId}</p>
        <p className="text-xs text-muted-foreground mt-4">
          {t('confirmation_email')}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" variant="outline" className="font-bold">
          <Link href="/">{t('back_to_shop')}</Link>
        </Button>
        <Button asChild size="lg" className="gap-2 font-bold">
          <Link href="/">
            {t('continue_shopping')}
            <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </div>
  );
}