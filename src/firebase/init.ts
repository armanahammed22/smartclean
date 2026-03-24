'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Robust singleton pattern for Next.js.
 * Ensures initialization happens exactly once and only in the browser.
 */
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Idempotent Firebase initialization.
 * CRITICAL: Returns nulls during SSR to prevent "fake" instances from crashing SDK functions.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  // 0. SSR Check: Firebase client SDK should not initialize on the server
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    // 1. Initialize App
    if (!firebaseApp) {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }

    // 2. Initialize Auth
    if (firebaseApp && !auth) {
      auth = getAuth(firebaseApp);
    }

    // 3. Initialize Firestore with stable transport (Long Polling)
    if (firebaseApp && !firestore) {
      try {
        // Force Long Polling to prevent the common transport errors (ca9)
        firestore = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e: any) {
        // Fallback to getFirestore if already initialized (common during HMR)
        firestore = getFirestore(firebaseApp);
      }
    }
  } catch (error) {
    console.error("Critical Firebase Initialization Error:", error);
  }

  return { firebaseApp, auth, firestore };
}
