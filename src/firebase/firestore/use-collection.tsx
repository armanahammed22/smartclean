'use client';

import { useState, useEffect } from 'react';
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

/**
 * Collections that are intended to be public. 
 * Errors on these won't trigger the global crash listener to avoid transient issues during auth resolution.
 */
const PUBLIC_COLLECTIONS = [
  'products', 
  'services', 
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
  'service_areas'
];

/**
 * Extracts a path string from either a CollectionReference or a Query.
 */
function getPathFromTarget(target: any): string {
  if (!target) return 'unknown-path';
  if (target.path) return target.path;
  // Attempt to extract from internal structure for Queries
  const internalPath = target._query?.path?.segments?.join('/') || target.converter?.path;
  return internalPath || 'query-path';
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const path = getPathFromTarget(memoizedTargetRefOrQuery);
        // Check if any segment of the path matches our public list
        const isPublic = PUBLIC_COLLECTIONS.some(pc => path.includes(pc));
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });
        
        setError(contextualError);
        setIsLoading(false);
        
        // CRITICAL FIX: Only emit to global listener (which crashes the app) 
        // if it's NOT a public collection. This prevents guest loops.
        if (!isPublic) {
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.warn(`Transient permission denial for public collection: ${path}. This usually resolves once Firebase Auth stabilizes.`);
        }
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}