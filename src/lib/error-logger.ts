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
 * Permanent Fix for Logging Loops (ca9 / b815)
 * This function is hardened to never attempt a Firestore write if the error
 * itself is related to a Firestore transport failure or internal assertion.
 */
export async function logError(error: any, context: ErrorContext = {}) {
  // If we are already in a logging process, abort to prevent recursion
  if (isLoggingInternal || !error) return;
  
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown Error');
  const errorStr = (message + " " + (error?.stack || "") + " " + JSON.stringify(error)).toLowerCase();

  /**
   * 🛡️ CRITICAL SYSTEM FILTER
   * Identify errors that indicate Firestore is in a broken state (ca9, b815, transport failures).
   * Attempting to write these BACK to Firestore will trigger an infinite loop.
   */
  const isBrokenStateError = 
    errorStr.includes('ca9') || 
    errorStr.includes('b815') || 
    errorStr.includes('assertion failed') ||
    errorStr.includes('unexpected state') ||
    errorStr.includes('transport') ||
    errorStr.includes('webchannel') ||
    errorStr.includes('offline') ||
    errorStr.includes('unavailable');

  if (isBrokenStateError) {
    // Only log to local console to prevent network recursion and loop crashes
    console.warn('[Error Logger] System-level Firestore failure detected. Suppressing DB write to prevent loop.', message);
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
    
    // 3. Fire-and-forget: Non-blocking write
    // We do NOT await this to ensure the UI remains responsive
    addDoc(colRef, errorPayload).catch((e) => {
      // If logging itself fails, just log to console
      console.error('[Error Logger] Failed to push log to Firestore:', e.message);
    });
    
  } catch (loggingError) {
    // Silent fail for the logger itself
  } finally {
    // Release the lock after a short delay to ensure clean state
    setTimeout(() => {
      isLoggingInternal = false;
    }, 100);
  }
}
