
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

function getPathFromTarget(target: any): string {
  if (!target) return 'unknown-path';
  if (target.path) return target.path;
  const internalPath = target._query?.path?.segments?.join('/') || target.converter?.path;
  return internalPath || 'query-path';
}

/**
 * Standardized hook for real-time Firestore collections.
 * Hardened against transport errors (ca9) and automatically logs permission issues.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
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

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
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
          
          // Log to Error Logs database
          logError(contextualError, { 
            severity: isPublic ? 'low' : 'medium',
            metadata: { path: currentPath, originalError: err.message }
          });

          if (!isPublic) {
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );
    } catch (e: any) {
      if (!e.message?.includes('ca9')) {
        logError(e, { severity: 'critical', metadata: { context: 'useCollection setup', path: currentPath } });
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
