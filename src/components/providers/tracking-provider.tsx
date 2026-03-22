
'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { trackEvent } from '@/lib/tracking';

/**
 * Global Tracking Provider
 * Handles Pixel initialization and automatic PageView tracking.
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const db = useFirestore();

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marketing') : null, [db]);
  const { data: config } = useDoc(configRef);

  // Initialize Pixel Script
  useEffect(() => {
    if (!config?.pixelId || !config?.trackingEnabled) return;

    if (typeof window !== 'undefined' && !window.fbq) {
      /* eslint-disable */
      (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      
      window.fbq('init', config.pixelId);
    }
  }, [config]);

  // Track PageView on Route Change
  useEffect(() => {
    if (config?.trackingEnabled) {
      trackEvent('PageView');
    }
  }, [pathname, config]);

  return <>{children}</>;
}
