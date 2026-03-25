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

function getPathFromTarget(target: any): string {
  if (!target) return 'unknown';
  return target.path || 'query';
}

/**
 * UI Hook optimized for resilient real-time collection syncing.
 * Permanently silences transport assertion errors (ca9, b815).
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

        const msg = err.message.toLowerCase();
        // 🛡️ SILENCE TRANSPORT FAILURES
        if (msg.includes('ca9') || msg.includes('b815') || msg.includes('assertion')) {
          console.warn(`[Firestore Transport] Silent recovery for: ${currentPath}`);
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
