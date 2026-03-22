
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
  try {
    const { firestore } = initializeFirebase();
    
    // Safety check: Ensure firestore is available before attempting to log
    if (!firestore) {
      console.error('[Error Logger] Firestore unavailable. Original error:', error);
      return;
    }

    const errorPayload = {
      message: error?.message || 'Unknown System Error',
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
    await addDoc(colRef, errorPayload);
    
    console.warn('[Error Logger] Captured & Dispatched:', errorPayload.message);
  } catch (loggingError) {
    // If the logger itself fails, fallback to console only
    console.error('[Error Logger] Failed to log to Firestore:', loggingError);
    console.error('[Original Error]:', error);
  }
}
