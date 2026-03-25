'use client';

/**
 * Final Recursive Guard (Local Only)
 * 🛡️ PREVENTS RECURSIVE LOOPS PERMANENTLY
 * This logger only outputs to the console to ensure maximum stability.
 * Database writes are disabled to prevent ca9/b815 assertion loops.
 */
export async function logError(error: any, context: any = {}) {
  const errorMsg = String(error?.message || error).toLowerCase();
  
  // Local console capture for developer inspection
  if (process.env.NODE_ENV === 'development') {
    console.group('System Shield: Local Error Capture');
    console.error('Error Trace:', error);
    console.info('Context Info:', context);
    console.groupEnd();
  }

  // Database logging is disabled permanently to ensure system resilience.
}
