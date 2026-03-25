'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache, terminate } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * 🛡️ THE ULTIMATE FIRESTORE RESILIENCE SHIELD
 * 1. Suppresses SDK internal assertion noise to prevent Next.js error overlays.
 * 2. Enforces Long Polling to bypass proxy/workstation streaming failures.
 * 3. Uses Memory Cache to eliminate IndexDB locking issues.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // 1. Global Silence for Firestore Assertion Failures (ca9 / b815)
  // This prevents the Next.js Error Overlay from triggering on non-fatal SDK noise.
  if (typeof window !== 'undefined' && !(window as any)._fs_shield_active) {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('ID: ca9') || msg.includes('ID: b815') || msg.includes('INTERNAL ASSERTION FAILED')) {
        // Silently log to console without triggering the error overlay
        console.warn('[Firestore Shield] Silenced internal SDK assertion noise:', msg.slice(0, 100) + '...');
        return;
      }
      originalConsoleError.apply(console, args);
    };
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
      
      /**
       * Force Long Polling and Memory Cache.
       * If firestore was already initialized (e.g. by another part of the SDK), 
       * we skip re-initialization to avoid the "already initialized" error.
       */
      try {
        firestore = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e) {
        firestore = getFirestore(firebaseApp);
      }
    }
  } catch (error) {
    // Silent catch during HMR/hot-reload
  }

  return { firebaseApp, auth, firestore };
}
