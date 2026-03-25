
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
 * Broadened to capture all variations of Firestore transport assertion loops.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  if (!error || error?._isLogged) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown System Error');
  const stack = error?.stack || 'No stack trace available';
  const stringified = String(error) + " " + JSON.stringify(error);

  // 1. BROAD FILTER: Skip all transport assertion errors (ca9, b815, internal failures)
  // Logging these back to Firestore while the transport is broken causes a recursive loop.
  const isTransportFailure = 
    message.includes('ca9') || 
    message.includes('b815') || 
    message.includes('INTERNAL ASSERTION FAILED') ||
    message.includes('Unexpected state') ||
    stringified.includes('ca9') ||
    stringified.includes('b815') ||
    stringified.includes('INTERNAL ASSERTION FAILED');

  if (isTransportFailure) {
    // Only log to console to prevent recursion and noise
    console.warn('[Error Logger] Suppressed Firestore internal error logging to prevent assertion loop.');
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
    if (!firestore) return;

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
    
    // Fire-and-forget
    addDoc(colRef, errorPayload).catch(() => {
      // Quietly fail if the logging itself fails
    });
    
    console.warn('[Error Logger] Captured:', message);
  } catch (loggingError) {
    console.error('[Error Logger] Logging system failure.');
  }
}
