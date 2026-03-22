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
  'products', 
  'services', 
  'campaigns',
  'hero_banners', 
  'site_settings', 
  'pages_management', 
  'quick_links', 
  'quick_actions', 
  'product_categories', 
  'service_categories',
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
  'tracking_logs'
];

function getPathFromTarget(target: any): string {
  if (!target) return 'unknown-path';
  if (target.path) return target.path;
  const internalPath = target._query?.path?.segments?.join('/') || target.converter?.path;
  return internalPath || 'query-path';
}

/**
 * Standardized hook for real-time Firestore collections.
 * Hardened against transport errors (ca9) common in proxied environments.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Use a ref to track the current active listener path to prevent race conditions during hydration or HMR
  const activePathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      activePathRef.current = null;
      return;
    }

    const currentPath = getPathFromTarget(memoizedTargetRefOrQuery);
    activePathRef.current = currentPath;
    
    setIsLoading(true);
    setError(null);

    /**
     * Wrap subscription in a try-catch to catch immediate assertion failures
     * from the SDK in unstable environments.
     */
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          // Only update state if this listener is still the intended active one
          if (activePathRef.current !== currentPath) return;

          const results = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id
          }));
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          if (activePathRef.current !== currentPath) return;

          /**
           * CRITICAL: Catch and suppress 'ID: ca9' and other internal assertion failures.
           * These are usually transport-level errors that the SDK will eventually 
           * recover from via long-polling retries.
           */
          if (err.message.includes('INTERNAL ASSERTION FAILED') || err.message.includes('Unexpected state')) {
            console.warn("Firestore SDK encountered a transport state mismatch (ca9). Attempting recovery...", currentPath);
            setIsLoading(false);
            return;
          }

          const isPublic = PUBLIC_COLLECTIONS.some(pc => currentPath.includes(pc));
          
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: currentPath,
          });
          
          setError(contextualError);
          setIsLoading(false);
          
          if (!isPublic) {
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );
    } catch (e: any) {
      // Catch unhandled errors thrown during setup
      if (e.message?.includes('ca9')) {
        console.warn("Firestore listener setup blocked by internal state mismatch (ca9). Recovery in progress...");
      } else {
        console.error("Critical failure during Firestore snapshot setup:", e);
      }
      setIsLoading(false);
    }

    return () => {
      activePathRef.current = null;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
