'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

const PUBLIC_DOCS = [
  'products', 'services', 'campaigns', 'hero_banners', 'site_settings', 
  'pages_management', 'quick_links', 'quick_actions', 'brands',
  'marketing_offers', 'reusable_features', 'reusable_specs', 'variant_types',
  'homepage_sections', 'payment_methods', 'coupons', 'service_areas',
  'delivery_options', 'offers', 'categories', 'subcategories', 
  'childcategories', 'top_nav_categories', 'landing_pages', 'product_qna'
];

/**
 * Highly resilient real-time document hook with internal error shielding.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const activeToken = useRef<string | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentPath = memoizedDocRef.path;
    const token = Math.random().toString(36);
    activeToken.current = token;
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (activeToken.current !== token) return;

        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        if (activeToken.current !== token) return;

        const errorStr = (err.message || JSON.stringify(err)).toLowerCase();
        
        // 🛡️ SDK Assertion Shield (ca9 / b815)
        if (errorStr.includes('ca9') || errorStr.includes('b815') || errorStr.includes('assertion failed')) {
          console.warn(`[Resilience Shield] Suppressed Firestore internal failure at doc: ${currentPath}`);
          setIsLoading(false);
          return;
        }

        const isPublic = PUBLIC_DOCS.some(pd => currentPath.includes(pd));
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: currentPath,
        });

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
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
