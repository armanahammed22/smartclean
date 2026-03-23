'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { logError } from '@/lib/error-logger';
import { useUser } from '@/firebase';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It logs the error to the database and throws it to be caught by the UI boundary.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // 1. Log the permission failure to the error monitoring system immediately
      logError(error, {
        userId: user?.uid,
        severity: 'critical',
        metadata: {
          type: 'Security Rule Violation',
          path: error.request.path,
          method: error.request.method
        }
      });

      // 2. Set error in state to trigger the throw for the UI boundary
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [user]);

  if (error) {
    throw error;
  }

  return null;
}
