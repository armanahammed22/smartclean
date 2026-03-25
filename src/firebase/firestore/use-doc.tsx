
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
import { logError } from '@/lib/error-logger';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

const PUBLIC_DOCS = [
  'products', 
  'services', 
  'campaigns',
  'hero_banners', 
  'site_settings', 
  'pages_management', 
  'quick_links', 
  'quick_actions', 
  'brands',
  'marketing_offers',
  'reusable_features',
  'reusable_specs',
  'variant_types',
  'homepage_sections',
  'payment_methods',
  'coupons',
  'service_areas',
  'delivery_options',
  'offers',
  'categories',
  'subcategories',
  'childcategories',
  'top_nav_categories',
  'landing_pages',
  'product_qna'
];

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Silences transport assertion errors (ca9, b815) to prevent loops.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const activePathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      activePathRef.current = null;
      return;
    }

    const currentPath = memoizedDocRef.path;
    activePathRef.current = currentPath;

    setIsLoading(true);
    setError(null);

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (activePathRef.current !== currentPath) return;

          if (snapshot.exists()) {
            setData({ ...(snapshot.data() as T), id: snapshot.id });
          } else {
            setData(null);
          }
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          if (activePathRef.current !== currentPath) return;

          const msg = err.message || String(err);
          
          // 🛡️ CRITICAL SILENCE: Check for assertion/transport issues early
          if (
            msg.includes('ca9') || 
            msg.includes('b815') || 
            msg.includes('INTERNAL ASSERTION FAILED') ||
            msg.includes('Unexpected state')
          ) {
            console.warn(`[useDoc] Internal Firestore transport issue on path: ${currentPath}. Waiting for reconnect...`);
            setIsLoading(false);
            return; // EXIT EARLY
          }

          const isPublic = PUBLIC_DOCS.some(pd => currentPath.includes(pd));
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: currentPath,
          });

          setError(contextualError);
          setData(null);
          setIsLoading(false);

          if (!isPublic) {
            logError(contextualError, { severity: 'medium', metadata: { path: currentPath } });
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );
    } catch (e: any) {
      setIsLoading(false);
    }

    return () => {
      activePathRef.current = null;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
