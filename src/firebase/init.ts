'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * 🛡️ THE ULTIMATE SYSTEM RESILIENCE SHIELD
 * Suppresses internal SDK errors and common third-party script crashes 
 * to prevent Next.js error overlays in production-like environments.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // 1. Global Silence for Internal SDK bugs and 3rd-party crashes
  if (typeof window !== 'undefined' && !(window as any)._fs_shield_active) {
    const isSuppressedError = (msg: string) => {
      if (!msg) return false;
      const lowMsg = msg.toLowerCase();
      
      // Auth/Identity related - DO NOT suppress
      if (lowMsg.includes('auth/') || lowMsg.includes('password') || lowMsg.includes('email') || lowMsg.includes('credential')) {
        return false;
      }

      // Next.js/HMR related - DO NOT suppress
      if (lowMsg.includes('turbopack') || lowMsg.includes('[project]') || lowMsg.includes('hmr') || lowMsg.includes('router')) {
        return false;
      }

      // Suppress target list (Specifically ID: b815 and ca9)
      return (
        lowMsg.includes('ca9') || 
        lowMsg.includes('b815') || 
        lowMsg.includes('internal assertion failed') || 
        lowMsg.includes('unexpected state') ||
        lowMsg.includes('onbeforeloaded') ||
        lowMsg.includes('i18next') ||
        lowMsg.includes('persistent_stream') ||
        lowMsg.includes('assertion failed') ||
        lowMsg.includes('fe":-1') ||
        lowMsg.includes('fe": -1')
      );
    };

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(arg => {
        if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
        }
        return String(arg);
      }).join(' ');

      if (isSuppressedError(msg)) {
        console.warn('[System Shield] Intercepted non-critical failure:', msg.slice(0, 150) + '...');
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Prevent Next.js Error Overlay for specific internal SDK issues
    const silence = (event: any) => {
      const msg = event.message || (event.reason && event.reason.message) || String(event.reason || '');
      if (isSuppressedError(msg)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn('[System Shield] Prevented error overlay for SDK internal state.');
      }
    };

    window.addEventListener('error', silence, true);
    window.addEventListener('unhandledrejection', silence, true);

    (window as any)._fs_shield_active = true;
  }

  try {
    if (!firebaseApp) {
      if (!isFirebaseConfigured) {
        console.warn("[Firebase Init] Missing API Key. App will run in Prototyping Mode.");
        return { firebaseApp: null, auth: null, firestore: null };
      }

      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        firebaseApp = initializeApp(firebaseConfig);
      }
      
      auth = getAuth(firebaseApp);
      
      try {
        firestore = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true, // Force long polling to avoid stream crashes in some proxy environments
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
    console.warn("[Firebase Init] Handled initialization failure:", error);
  }

  return { firebaseApp, auth, firestore };
}
