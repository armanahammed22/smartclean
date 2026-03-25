'use client';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init';

export type ErrorSeverity = 'low' | 'medium' | 'critical';

export interface ErrorContext {
  userId?: string | null;
  role?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
}

/**
 * Global Error Logging Utility
 * Automatically dispatches system errors to Firestore for monitoring.
 * Hardened to prevent recursive loops during Firestore transport failures.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  // 1. Prevent logging the same error object repeatedly or recursive calls
  if (!error || error?._isLogged) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown System Error');
  const stack = error?.stack || 'No stack trace available';
  const stringified = String(error);

  // 2. CRITICAL FILTER: Skip transport assertion errors (ca9, b815, internal failures)
  // These indicate the Firestore connection is currently broken or in an unstable state.
  // Attempting to log them TO Firestore will cause a recursive crash (Assertion Loop).
  const isTransportFailure = 
    message.includes('ca9') || 
    message.includes('b815') || 
    message.includes('INTERNAL ASSERTION FAILED') ||
    message.includes('Unexpected state') ||
    stringified.includes('ca9') ||
    stringified.includes('b815') ||
    stringified.includes('INTERNAL ASSERTION FAILED');

  if (isTransportFailure) {
    // Only log to console to prevent recursion
    console.warn('[Error Logger] Suppressed database logging for Firestore internal assertion failure to prevent loop.');
    return;
  }

  // Mark as logged to prevent duplicates
  if (typeof error === 'object') {
    try {
      error._isLogged = true;
    } catch (e) {
      // ignore read-only errors
    }
  }

  try {
    const { firestore } = initializeFirebase();
    
    // Safety check: Ensure firestore is available before attempting to log
    if (!firestore) {
      console.error('[Error Logger] Firestore unavailable. Original error:', message);
      return;
    }

    const errorPayload = {
      message,
      stack,
      page: typeof window !== 'undefined' ? window.location.href : 'Server',
      userId: context.userId || 'Guest',
      role: context.role || 'User',
      severity: context.severity || 'medium',
      status: 'pending',
      metadata: context.metadata || {},
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    };

    const colRef = collection(firestore, 'error_logs');
    
    // 3. Fire-and-forget: Non-blocking write
    addDoc(colRef, errorPayload).catch((e) => {
      // If logging itself fails, just log to console
      console.error('[Error Logger] Failed to push log to Firestore:', e.message);
    });
    
    console.warn('[Error Logger] Captured:', message);
  } catch (loggingError) {
    console.error('[Error Logger] Critical failure in logging mechanism:', loggingError);
    console.error('[Original Error]:', message);
  }
}
