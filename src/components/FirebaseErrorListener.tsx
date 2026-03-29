'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Note: console.error logging has been removed to prevent triggering multiple error screens.
 * The error is thrown to be caught by the standard Next.js error boundary/overlay.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger the throw for the UI boundary
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (error) {
    // Throwing the error here surfaces it to the Next.js development overlay
    // with the full contextual information provided by FirestorePermissionError.
    throw error;
  }

  return null;
}
