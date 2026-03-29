
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Loader2, ArrowLeft, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';

export default function DynamicContentPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageQuery = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return query(collection(db, 'pages_management'), where('slug', '==', slug), limit(1));
  }, [db, slug]);

  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t('loading_content')}</p>
    </div>
  );

  if (!page || !page.isPublished) return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-200 uppercase tracking-tighter">{t('error_404_title')}</h1>
        <div className="space-y-2">
          <p className="text-muted-foreground font-bold uppercase tracking-widest">{t('error_404_desc')}</p>
          <p className="text-muted-foreground text-sm">{t('error_404_removed')}</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-full px-10 h-12 font-black uppercase text-xs">
          {t('go_home')}
        </Button>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-24">
        <header className="bg-white border-b py-12 md:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12 pointer-events-none">
            <FileText size={240} />
          </div>
          <div className="container mx-auto px-4 max-w-4xl relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-gray-50 h-10 w-10">
                <ArrowLeft size={20} />
              </Button>
              <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">
                {page.slug.replace('-', ' ')}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#081621] font-headline tracking-tighter uppercase leading-tight">
              {page.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <Calendar size={14} className="text-primary" />
              Published: {mounted && page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '...'}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 max-w-4xl py-16">
          <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-sm border border-gray-100">
            <article 
              className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-loose prose-li:text-gray-600 prose-strong:text-gray-900 prose-h2:text-2xl prose-h2:mb-6 prose-h2:mt-10 first:prose-h2:mt-0"
              dangerouslySetInnerHTML={{ __html: page.content }} 
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
