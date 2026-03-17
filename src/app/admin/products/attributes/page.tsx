
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect module to standardized routing
 */
export default function AttributesRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/attributes/brands');
  }, [router]);

  return null;
}
