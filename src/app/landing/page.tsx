'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 🛡️ REDIRECT: The separate /landing route has been removed.
 * All landing page logic is now handled dynamically via /[slug].
 */
export default function RedirectLanding() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
