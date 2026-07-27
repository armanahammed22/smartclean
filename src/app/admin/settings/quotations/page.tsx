'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectQuotationSettings() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/settings/documents');
  }, [router]);

  return (
    <div className="p-32 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Migrating to Document Engine...</p>
    </div>
  );
}
