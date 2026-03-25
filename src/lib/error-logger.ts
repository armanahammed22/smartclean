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

// 🛡️ GLOBAL RECURSION GUARD: Prevents infinite logging loops
let isLoggingInternal = false;

/**
 * Global Error Logging Utility
 * Automatically dispatches system errors to Firestore for monitoring.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  // 1. Exit if we are already in a logging process or error is invalid
  if (isLoggingInternal || !error) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown System Error');
  const stringified = String(error) + " " + JSON.stringify(error);

  // 2. AGGRESSIVE FILTER: Skip all Firestore transport/assertion errors.
  // These occur when the SDK itself is in a broken state. 
  // Attempting to write these back to Firestore will ALWAYS cause a loop.
  const isTransportFailure = 
    message.includes('ca9') || 
    message.includes('b815') || 
    message.includes('INTERNAL ASSERTION FAILED') ||
    message.includes('Unexpected state') ||
    stringified.includes('ca9') ||
    stringified.includes('b815');

  if (isTransportFailure) {
    // We only log to console for transport failures to prevent recursion
    console.warn('[Error Logger] Suppressed Firestore internal transport failure from DB write to prevent loop.');
    return;
  }

  // Set the lock
  isLoggingInternal = true;

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      isLoggingInternal = false;
      return;
    }

    const errorPayload = {
      message,
      stack: error?.stack || 'No stack trace available',
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
    
    // Fire-and-forget: Non-blocking write
    addDoc(colRef, errorPayload).catch((e) => {
      console.error('[Error Logger] Failed to push log to Firestore:', e.message);
    });
    
    console.warn('[Error Logger] Captured:', message);
  } catch (loggingError) {
    console.error('[Error Logger] Internal failure during log execution.');
  } finally {
    // 🛡️ CRITICAL: Always release the lock
    isLoggingInternal = false;
  }
}
