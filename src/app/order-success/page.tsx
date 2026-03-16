
"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight, ShieldCheck, Copy, ExternalLink, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  const orderId = searchParams.get('id') || 'UNKNOWN';
  const tempPw = searchParams.get('pw');
  const userEmail = searchParams.get('email');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Details copied to clipboard." });
  };

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="bg-green-100 p-6 rounded-full animate-bounce">
              <CheckCircle2 size={64} className="text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black font-headline text-[#081621] uppercase tracking-tight">
              {t('order_confirmed')}
            </h1>
            <p className="text-muted-foreground font-medium text-lg px-4">
              {t('thank_you_order')}
            </p>
          </div>
          
          <Card className="w-full rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-10 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('order_id')}</p>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                  <span className="text-xl font-mono font-black text-gray-900">#SC-{orderId.slice(0, 8).toUpperCase()}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(orderId)}><Copy size={16} /></Button>
                </div>
              </div>

              {/* Auto-Account Info */}
              {tempPw && (
                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <div className="space-y-2 text-left">
                    <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] px-3 py-1 rounded-full">{t('account_created')}</Badge>
                    <p className="text-xs text-muted-foreground font-bold">{t('login_info')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Login Email</label>
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-bold">
                          <Mail size={16} /> <span>{userEmail}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => copyToClipboard(userEmail || '')}><Copy size={16} /></Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('temp_password')}</label>
                      <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700 font-black font-mono">
                          <Lock size={16} /> <span>{tempPw}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-amber-600" onClick={() => copyToClipboard(tempPw)}><Copy size={16} /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <Button asChild size="lg" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 uppercase tracking-tight gap-3">
                  <Link href="/account/dashboard">
                    Go to My Dashboard
                    <ExternalLink size={20} />
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" className="font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
                  <Link href="/">{t('back_to_shop')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
            {t('confirmation_email')}
          </p>
        </div>
      </div>
    </div>
  );
}
