'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * 🛡️ Redirector to Multi-Segment Catch-all
 * Ensures even single-segment IDs are handled by the robust catch-all logic.
 */
export default function SingleQuotationRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/quotation/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resolving Document...</p>
    </div>
  );
}
