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
  'childcategories'
];

function getPathFromTarget(target: any): string {
  if (!target) return 'unknown-path';
  if (target.path) return target.path;
  const internalPath = target._query?.path?.segments?.join('/') || target.converter?.path;
  return internalPath || 'query-path';
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Use a ref to track the current active listener path to prevent race conditions during HMR
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

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Only update state if this listener is still the active one
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

        const isPublic = PUBLIC_COLLECTIONS.some(pc => currentPath.includes(pc));
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: currentPath,
        });
        
        setError(contextualError);
        setIsLoading(false);
        
        if (!isPublic) {
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.warn(`Permission warning for public collection: ${currentPath}. Access will retry.`);
        }
      }
    );

    return () => {
      activePathRef.current = null;
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
