'use client';

/**
 * Error Logger (DISABLED)
 * This utility has been disabled to prevent Firestore assertion loops (ID: ca9, b815).
 * All system errors are now directed to the browser console only.
 */
export async function logError(error: any, context: any = {}) {
  // We only log to console now to keep the system stable
  if (process.env.NODE_ENV === 'development') {
    console.error('[System Error Capture]:', error, context);
  }
}
