'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * 🛡️ LEGACY REDIRECT: Redirects old ID-based links to clean SEO URLs.
 */
export default function LegacyInvoiceRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        router.replace(`/invoice/${id}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Upgrading Billing URL...</p>
    </div>
  );
}
