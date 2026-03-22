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

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Hardened against transport errors common in proxied environments.
 * 
 * @template T Optional type for document data. Defaults to any.
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

          if (err.message.includes('INTERNAL ASSERTION FAILED') || err.message.includes('Unexpected state')) {
            console.warn("Firestore SDK encountered a transport state mismatch (ca9) during doc read.", currentPath);
            setIsLoading(false);
            return;
          }

          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: currentPath,
          });

          setError(contextualError);
          setData(null);
          setIsLoading(false);

          errorEmitter.emit('permission-error', contextualError);
        }
      );
    } catch (e: any) {
      if (e.message?.includes('ca9')) {
        console.warn("Firestore doc listener setup blocked by internal state mismatch (ca9).");
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
