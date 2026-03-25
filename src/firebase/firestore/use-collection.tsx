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
 * Extracts path string from a CollectionReference or Query object.
 */
function getPathFromTarget(target: any): string {
  if (!target) return 'unknown';
  if (typeof target.path === 'string') return target.path;
  if (target._query?.path) return target._query.path.toString();
  return 'query';
}

/**
 * UI Hook optimized for resilient real-time collection syncing.
 * Silences fatal errors for public collections and system assertions to prevent app crashes.
 */
export function useCollection<T = any>(
  memoizedTarget: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTarget);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const pathRef = useRef<string>('');

  useEffect(() => {
    if (!memoizedTarget) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentPath = getPathFromTarget(memoizedTarget);
    pathRef.current = currentPath;
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTarget,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (pathRef.current !== currentPath) return;
        const results = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        if (pathRef.current !== currentPath) return;

        const msg = (err.message || '').toLowerCase();
        
        /**
         * 🛡️ TRANSPORT FILTER
         * Silence transport failures (ca9, b815) to prevent infinite error loops.
         */
        if (msg.includes('ca9') || msg.includes('b815') || msg.includes('assertion') || msg.includes('unexpected state')) {
          console.warn(`[Firestore Resiliency] Recovering from transport failure at: ${currentPath}`);
          setIsLoading(false);
          return;
        }

        const isPublic = PUBLIC_COLLECTIONS.some(pc => currentPath.includes(pc));
        const contextualError = new FirestorePermissionError({ operation: 'list', path: currentPath });
        
        setError(contextualError);
        setIsLoading(false);
        
        if (!isPublic) {
          logError(contextualError, { severity: 'medium', metadata: { path: currentPath } });
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.warn(`[useCollection] Silent fail on public resource: ${currentPath}`);
        }
      }
    );

    return () => {
      pathRef.current = '';
      unsubscribe();
    };
  }, [memoizedTarget]);

  return { data, isLoading, error };
}
