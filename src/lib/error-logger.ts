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
 * Permanent Fix for Logging Loops
 * Automatically detects and silences Firestore transport/assertion errors
 * to prevent the 'ca9' and 'b815' error storm.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  if (isLoggingInternal || !error) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown Error');
  const errorStr = String(error).toLowerCase() + " " + JSON.stringify(error).toLowerCase();

  // 🛡️ PERMANENT EXCLUSION FILTER
  // Skip any errors related to Firestore transport or internal assertions.
  // Writing these back to Firestore will ALWAYS trigger a recursive loop.
  const isSystemAssertion = 
    errorStr.includes('ca9') || 
    errorStr.includes('b815') || 
    errorStr.includes('assertion failed') ||
    errorStr.includes('unexpected state') ||
    errorStr.includes('transport') ||
    errorStr.includes('webchannel');

  if (isSystemAssertion) {
    // Only log to local console to prevent network recursion
    console.warn('[Error Logger] Suppressed Firestore internal transport failure from DB write to prevent recursion loop.');
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
      // Fail silently if DB write fails during a transport issue
    });
    
  } catch (loggingError) {
    // Fail silently
  } finally {
    isLoggingInternal = false;
  }
}
