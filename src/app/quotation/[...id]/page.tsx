'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * 🛡️ LEGACY REDIRECT: Redirects catch-all quotation links to the primary [id] route.
 * This resolves the conflict between [id] and [...id].
 */
export default function CatchAllQuotationRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id && Array.isArray(params.id)) {
      const targetId = params.id[0];
      router.replace(`/quotation/${targetId}`);
    }
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Documentation...</p>
    </div>
  );
}
