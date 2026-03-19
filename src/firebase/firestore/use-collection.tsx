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
 * Extracts a path string from either a CollectionReference or a Query.
 */
function getPathFromTarget(target: any): string {
  if (!target) return 'unknown-path';
  // CollectionReference has a .path property
  if (target.path) return target.path;
  // For Query objects, we attempt to find the path in internal structures if available
  return target._query?.path?.segments?.join('/') || 'query-path';
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

    // Enforce memoization to prevent infinite render loops
    if (!memoizedTargetRefOrQuery.__memo) {
      console.warn('Firestore query/reference was not properly memoized using useMemoFirebase. This can cause significant performance issues.');
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
        // Only log and emit if it's not a background query that failed due to auth delay
        // We avoid crashing the whole app for transient guest listing attempts
        const path = getPathFromTarget(memoizedTargetRefOrQuery);
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });
        
        setError(contextualError);
        setIsLoading(false);
        
        // Background permission checks for public collections shouldn't trigger the global listener instantly
        // if they are likely to resolve upon auth state completion.
        // However, for debugging we emit it.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}