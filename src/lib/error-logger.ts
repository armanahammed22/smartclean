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

// 🛡️ GLOBAL RECURSION LOCK
let isLoggingInternal = false;

/**
 * Permanent Fix for Logging Loops (ca9 / b815)
 * Hardened to bail out immediately if the error is a Firestore transport or assertion failure.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  if (isLoggingInternal || !error) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown Error');
  const errorStr = (message + " " + (error?.stack || "") + " " + JSON.stringify(error)).toLowerCase();

  /**
   * 🛡️ CRITICAL SYSTEM FILTER
   * We MUST NOT try to write back to Firestore if the error suggests 
   * Firestore's transport or internal state is broken (ca9, b815).
   */
  const isBrokenStateError = 
    errorStr.includes('ca9') || 
    errorStr.includes('b815') || 
    errorStr.includes('assertion failed') ||
    errorStr.includes('unexpected state') ||
    errorStr.includes('transport') ||
    errorStr.includes('webchannel') ||
    errorStr.includes('unavailable') ||
    errorStr.includes('offline');

  if (isBrokenStateError) {
    console.warn('[Error Logger] Suppressing Firestore write for internal SDK failure to prevent loop.', message);
    return;
  }

  isLoggingInternal = true;

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      isLoggingInternal = false;
      return;
    }

    const errorPayload = {
      message,
      stack: error?.stack || 'No stack trace',
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
      // Intentionally silent to prevent loop
    });
    
  } catch (loggingError) {
    // Silent fail
  } finally {
    // Lock release with delay
    setTimeout(() => {
      isLoggingInternal = false;
    }, 500);
  }
}
