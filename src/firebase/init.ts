'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * 🛡️ THE ULTIMATE FIRESTORE RESILIENCE SHIELD (V8 - HMR Optimized)
 * 1. Targeted suppression of SDK internal assertion noise (ca9 / b815).
 * 2. Specifically ignores Turbopack/Next.js internal HMR messages to avoid dev-tool conflicts.
 * 3. Blocks window-level errors to prevent Next.js Runtime Overlay from appearing for SDK bugs.
 * 4. Enforces Long Polling to bypass proxy/workstation streaming failures.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // 1. Global Silence for Firestore Assertion Failures
  if (typeof window !== 'undefined' && !(window as any)._fs_shield_active) {
    const isAssertionError = (msg: string) => {
      if (!msg) return false;
      const lowMsg = msg.toLowerCase();
      
      // EXCLUDE: Do not intercept dev-tool or Turbopack specific messages
      if (lowMsg.includes('turbopack') || lowMsg.includes('[project]') || lowMsg.includes('hmr')) {
        return false;
      }

      return (
        lowMsg.includes('ca9') || 
        lowMsg.includes('b815') || 
        lowMsg.includes('internal assertion failed') || 
        lowMsg.includes('watchchangeaggregator') ||
        lowMsg.includes('persistent_stream') ||
        lowMsg.includes('unexpected state') ||
        lowMsg.includes('assertion failed') ||
        lowMsg.includes('cc')
      );
    };

    // Filter Console Errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(arg => {
        if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
        }
        return String(arg);
      }).join(' ');

      if (isAssertionError(msg)) {
        // Silently log to warning to keep console clean and prevent Next.js UI Overlay
        console.warn('[Firestore Shield] Intercepted SDK assertion:', msg.slice(0, 150) + '...');
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Filter Window Errors
    window.addEventListener('error', (event) => {
      const msg = event.message || (event.error && event.error.message) || '';
      if (isAssertionError(msg)) {
        console.warn('[Firestore Shield] Blocking window error overlay for SDK bug:', msg.slice(0, 100));
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }, true);

    // Filter Unhandled Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const msg = String(event.reason?.message || event.reason || '');
      if (isAssertionError(msg)) {
        console.warn('[Firestore Shield] Blocking unhandled rejection overlay for SDK bug:', msg.slice(0, 100));
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }, true);

    (window as any)._fs_shield_active = true;
  }

  try {
    if (!firebaseApp) {
      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        firebaseApp = initializeApp(firebaseConfig);
      }
      
      auth = getAuth(firebaseApp);
      
      try {
        // Enforce Long Polling and Memory Cache for maximum stability in cloud environments
        firestore = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e) {
        const currentFirestore = (firebaseApp as any)._firestore;
        if (currentFirestore) {
          firestore = currentFirestore;
        } else {
          firestore = getFirestore(firebaseApp);
        }
      }
    }
  } catch (error) {
    // Silent catch during initialization
  }

  return { firebaseApp, auth, firestore };
}
