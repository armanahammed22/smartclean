
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
 * Hardened document hook with internal retry shield for internal SDK assertion failures.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const activeToken = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    let unsubscribe: () => void = () => {};

    const startListener = () => {
      unsubscribe = onSnapshot(
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
          
          // 🛡️ SDK Resilience Shield: Silently suppress assertion failures and retry
          if (errorStr.includes('ca9') || errorStr.includes('b815') || errorStr.includes('assertion failed')) {
            console.warn(`[Firestore Shield] Retrying transient assertion error at doc: ${currentPath}`);
            
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => {
              if (activeToken.current === token) startListener();
            }, 2000);
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
    };

    startListener();

    return () => {
      activeToken.current = null;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      unsubscribe();
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
