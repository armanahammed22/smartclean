'use client';

/**
 * Error Logger (Defensive Design)
 * 🛡️ PREVENTS RECURSIVE LOOPS: This logger will NOT attempt to write to Firestore
 * if the error is related to Firestore itself or network transport.
 */
export async function logError(error: any, context: any = {}) {
  const errorMsg = String(error?.message || error).toLowerCase();
  
  // 1. Silent Shield: Never log transport or assertion errors back to the database
  const isTransportError = 
    errorMsg.includes('ca9') || 
    errorMsg.includes('b815') || 
    errorMsg.includes('assertion failed') ||
    errorMsg.includes('offline') ||
    errorMsg.includes('network');

  if (isTransportError) {
    console.warn('[System Shield] Suppressed recursive logging for transport error:', errorMsg);
    return;
  }

  // 2. Local console capture for developer inspection
  if (process.env.NODE_ENV === 'development') {
    console.group('Capture: System Error');
    console.error('Error:', error);
    console.info('Context:', context);
    console.groupEnd();
  }

  // 3. Optional: Database logging only for application-level logic errors
  // To avoid recursive crashes, we keep this purely local for now.
}
