
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Copy, ExternalLink, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const orderId = searchParams.get('id') || 'UNKNOWN';
  const tempPw = searchParams.get('pw');
  const userEmail = searchParams.get('email');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Details copied to clipboard." });
  };

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F8]">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* ICON */}
          <div className="relative">
            <div className="bg-green-100 p-6 rounded-full animate-bounce">
              <CheckCircle2 size={64} className="text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
              <ShieldCheck size={20} />
            </div>
          </div>

          {/* TEXT */}
          <div className="space-y-3">
            <h1 className="text-4xl font-black font-headline text-[#081621] uppercase tracking-tight">
              {t('order_confirmed')}
            </h1>
            <p className="text-muted-foreground font-medium text-lg px-4">
              {t('thank_you_order')}
            </p>
          </div>

          {/* CARD */}
          <Card className="w-full rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-10 space-y-8">

              {/* ORDER ID */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  {t('order_id')}
                </p>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xl font-mono font-black text-gray-900">
                    #SC-{orderId.slice(0, 8).toUpperCase()}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(orderId)}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* ACCOUNT INFO */}
              {tempPw && (
                <div className="space-y-6 pt-6 border-t border-gray-100">
                  
                  <div className="space-y-2 text-left">
                    <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] px-3 py-1 rounded-full">
                      {t('account_created')}
                    </Badge>
                    <p className="text-xs text-muted-foreground font-bold">
                      {t('login_info')}
                    </p>
                  </div>

                  <div className="grid gap-4">

                    {/* EMAIL */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-muted-foreground">
                        Login Email
                      </label>
                      <div className="flex justify-between p-4 bg-blue-50 rounded-2xl border">
                        <span className="truncate">{userEmail}</span>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userEmail || '')}>
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-muted-foreground">
                        {t('temp_password')}
                      </label>
                      <div className="flex justify-between p-4 bg-amber-50 rounded-2xl border">
                        <span>{tempPw}</span>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPw)}>
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="space-y-4 pt-4">
                <Button asChild size="lg" className="w-full h-16">
                  <Link href="/account/dashboard">
                    Go to My Dashboard
                    <ExternalLink size={20} />
                  </Link>
                </Button>

                <Button asChild variant="ghost">
                  <Link href="/">{t('back_to_shop')}</Link>
                </Button>
              </div>

            </CardContent>
          </Card>

          <p className="text-[10px] font-black uppercase text-gray-400">
            {t('confirmation_email')}
          </p>

        </div>
      </div>
    </div>
  );
}
