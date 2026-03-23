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
 */
export async function logError(error: any, context: ErrorContext = {}) {
  // Prevent logging the same error repeatedly in a loop
  if (error?._isLogged) return;
  if (error) error._isLogged = true;

  try {
    const { firestore } = initializeFirebase();
    
    // Safety check: Ensure firestore is available before attempting to log
    if (!firestore) {
      console.error('[Error Logger] Firestore unavailable. Original error:', error);
      return;
    }

    const message = error?.message || (typeof error === 'string' ? error : 'Unknown System Error');
    const stack = error?.stack || 'No stack trace available';

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
    await addDoc(colRef, errorPayload);
    
    console.warn('[Error Logger] Captured & Dispatched:', message);
  } catch (loggingError) {
    // If the logger itself fails, fallback to console only
    console.error('[Error Logger] Failed to log to Firestore:', loggingError);
    console.error('[Original Error]:', error);
  }
}
