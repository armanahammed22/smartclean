'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

const PUBLIC_COLLECTIONS = [
  'products', 'services', 'sub_services', 'campaigns', 'hero_banners', 'site_settings', 
  'pages_management', 'quick_links', 'quick_actions', 'brands',
  'marketing_offers', 'reusable_features', 'reusable_specs', 'variant_types',
  'homepage_sections', 'payment_methods', 'coupons', 'service_areas',
  'delivery_options', 'offers', 'categories', 'subcategories', 
  'childcategories', 'top_nav_categories', 'landing_pages', 'product_qna',
  'invoices', 'invoiceRequests'
];

function extractPath(target: any): string {
  try {
    if (!target) return 'unknown';
    if (target.path) return target.path;
    if (target._query?.path?.segments) {
      return target._query.path.segments.join('/');
    }
  } catch (e) {}
  return 'query';
}

/**
 * Hardened collection hook with internal retry shield for internal SDK assertion failures (ca9/b815).
 * Forces a silent refresh if the watch stream encounters an internal SDK bug.
 */
export function useCollection<T = any>(
  memoizedTarget: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTarget);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const activeToken = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!memoizedTarget) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentPath = extractPath(memoizedTarget);
    const token = Math.random().toString(36);
    activeToken.current = token;
    setIsLoading(true);

    let unsubscribe: (() => void) | null = null;

    const startListener = () => {
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
        unsubscribe = null;
      }

      try {
        unsubscribe = onSnapshot(
          memoizedTarget,
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (activeToken.current !== token) return;
            const results = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
            setData(results);
            setError(null);
            setIsLoading(false);
          },
          (err: any) => {
            if (activeToken.current !== token) return;

            const errorStr = (err.message || String(err)).toLowerCase();
            
            // 🛡️ SDK Resilience Shield: Detection of internal assertion IDs
            if (
              errorStr.includes('ca9') || 
              errorStr.includes('b815') || 
              errorStr.includes('assertion failed') || 
              errorStr.includes('unexpected state') ||
              errorStr.includes('persistent_stream') ||
              errorStr.includes('fe":-1')
            ) {
              console.warn(`[Firestore Shield] Recovering from SDK assertion in collection: ${currentPath}.`);
              
              if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = setTimeout(() => {
                if (activeToken.current === token) setRefreshKey(k => k + 1);
              }, 2000); // 2s retry for SDK stabilization
              return;
            }

            const isPublic = PUBLIC_COLLECTIONS.some(pc => currentPath.includes(pc));
            const contextualError = new FirestorePermissionError({ operation: 'list', path: currentPath });
            
            setError(contextualError);
            setIsLoading(false);
            
            if (!isPublic) {
              errorEmitter.emit('permission-error', contextualError);
            }
          }
        );
      } catch (setupError: any) {
        const setupErrorStr = setupError.message.toLowerCase();
        if (setupErrorStr.includes('ca9') || setupErrorStr.includes('b815')) {
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (activeToken.current === token) setRefreshKey(k => k + 1);
          }, 3000);
        }
      }
    };

    startListener();

    return () => {
      activeToken.current = null;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [memoizedTarget, refreshKey]);

  return { data, isLoading, error };
}
