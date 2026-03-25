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
import { logError } from '@/lib/error-logger';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

const PUBLIC_COLLECTIONS = [
  'products', 'services', 'campaigns', 'hero_banners', 'site_settings', 
  'pages_management', 'quick_links', 'quick_actions', 'brands',
  'marketing_offers', 'reusable_features', 'reusable_specs', 'variant_types',
  'homepage_sections', 'payment_methods', 'coupons', 'service_areas',
  'delivery_options', 'offers', 'categories', 'subcategories', 
  'childcategories', 'top_nav_categories', 'landing_pages', 'product_qna'
];

/**
 * Extracts collection path from Query/CollectionReference.
 */
function extractPath(target: any): string {
  if (!target) return 'unknown';
  if (target.path) return target.path;
  if (target._query?.path?.segments) return target._query.path.segments.join('/');
  return 'query';
}

/**
 * Highly resilient real-time collection hook.
 * Strictly silences SDK internal assertion failures (ca9, b815) to prevent app crash loops.
 */
export function useCollection<T = any>(
  memoizedTarget: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTarget);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const activeToken = useRef<string | null>(null);

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

    const unsubscribe = onSnapshot(
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

        const errorStr = JSON.stringify(err).toLowerCase() + (err.message || '').toLowerCase();
        
        /**
         * 🛡️ INTERNAL ASSERTION SUPPRESSION
         * ca9 and b815 are non-recoverable internal state errors. 
         * We silence them to prevent the UI from crashing or looping.
         */
        if (errorStr.includes('ca9') || errorStr.includes('b815') || errorStr.includes('assertion failed') || errorStr.includes('unexpected state')) {
          console.warn(`[Firestore Shield] Suppressed internal SDK failure at: ${currentPath}`);
          setIsLoading(false);
          return;
        }

        const isPublic = PUBLIC_COLLECTIONS.some(pc => currentPath.includes(pc));
        const contextualError = new FirestorePermissionError({ operation: 'list', path: currentPath });
        
        setError(contextualError);
        setIsLoading(false);
        
        // Only trigger global handlers for non-public (protected) resources
        if (!isPublic) {
          logError(contextualError, { severity: 'medium', metadata: { path: currentPath } });
          errorEmitter.emit('permission-error', contextualError);
        }
      }
    );

    return () => {
      activeToken.current = null;
      unsubscribe();
    };
  }, [memoizedTarget]);

  return { data, isLoading, error };
}
