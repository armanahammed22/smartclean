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
  'top_nav_categories',
  'landing_pages',
  'bookings',
  'orders',
  'leads',
  'support_tickets',
  'users',
  'error_logs',
  'product_qna'
];

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Automatically logs access errors to the global error monitoring system.
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

          // Suppress the "Unexpected state (ID: ca9)" internal assertion error
          if (err.message.includes('INTERNAL ASSERTION FAILED') || err.message.includes('Unexpected state') || err.message.includes('ca9')) {
            setIsLoading(false);
            return;
          }

          const isPublic = PUBLIC_DOCS.some(pd => currentPath.includes(pd));
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: currentPath,
          });

          setError(contextualError);
          setData(null);
          setIsLoading(false);

          // Log to centralized error system
          logError(contextualError, { 
            severity: 'medium',
            metadata: { path: currentPath, originalError: err.message }
          });

          if (!isPublic) {
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );
    } catch (e: any) {
      if (!e.message?.includes('ca9')) {
        logError(e, { severity: 'critical', metadata: { context: 'useDoc setup', path: currentPath } });
      }
      setIsLoading(false);
    }

    return () => {
      activePathRef.current = null;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
