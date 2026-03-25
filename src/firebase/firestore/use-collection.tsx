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
  'products', 'services', 'campaigns', 'hero_banners', 'site_settings', 
  'pages_management', 'quick_links', 'quick_actions', 'brands',
  'marketing_offers', 'reusable_features', 'reusable_specs', 'variant_types',
  'homepage_sections', 'payment_methods', 'coupons', 'service_areas',
  'delivery_options', 'offers', 'categories', 'subcategories', 
  'childcategories', 'top_nav_categories', 'landing_pages', 'product_qna'
];

function extractPath(target: any): string {
  if (!target) return 'unknown';
  if (target.path) return target.path;
  if (target._query?.path?.segments) {
    return target._query.path.segments.join('/');
  }
  return 'query';
}

/**
 * Resilient collection hook with aggressive internal error suppression for SDK noise.
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

        const errorStr = (err.message || JSON.stringify(err)).toLowerCase();
        
        // 🛡️ SDK Resilience Shield: Silently suppress common workstation assertion failures
        if (errorStr.includes('ca9') || errorStr.includes('b815') || errorStr.includes('assertion failed')) {
          console.warn(`[Firestore Shield] Suppressed transient assertion error at: ${currentPath}`);
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

    return () => {
      activeToken.current = null;
      unsubscribe();
    };
  }, [memoizedTarget]);

  return { data, isLoading, error };
}
