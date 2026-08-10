'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * 🛡️ SINGLE SEGMENT REDIRECT
 * Ensures consistency by routing single IDs to the catch-all robust handler.
 */
export default function SingleQuotationRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      // Decode and replace slashes if any (though usually handled by [...id])
      const id = decodeURIComponent(params.id as string);
      router.replace(`/quotation/${id}`);
    }
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Document...</p>
    </div>
  );
}
