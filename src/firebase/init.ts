'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Robust singleton pattern for Next.js.
 * Storing instances on globalThis ensures they persist across HMR reloads.
 */
const globalForFirebase = globalThis as unknown as {
  __firebaseApp: FirebaseApp | undefined;
  __firebaseAuth: Auth | undefined;
  __firestoreDb: Firestore | undefined;
};

/**
 * Idempotent Firebase initialization.
 * Hardened to ensure services are returned independently even if one fails.
 * CRITICAL: Returns nulls during SSR to prevent "fake" instances from crashing SDK functions.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  // 0. SSR Check: Firebase client SDK should not initialize on the server
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  let app: FirebaseApp | null = null;
  let auth: Auth | null = null;
  let firestore: Firestore | null = null;

  try {
    // 1. Initialize App
    if (!globalForFirebase.__firebaseApp) {
      if (getApps().length > 0) {
        globalForFirebase.__firebaseApp = getApp();
      } else {
        globalForFirebase.__firebaseApp = initializeApp(firebaseConfig);
      }
    }
    app = globalForFirebase.__firebaseApp;

    // 2. Initialize Auth
    if (app && !globalForFirebase.__firebaseAuth) {
      globalForFirebase.__firebaseAuth = getAuth(app);
    }
    auth = globalForFirebase.__firebaseAuth || null;

    // 3. Initialize Firestore with stable transport (Long Polling)
    if (app && !globalForFirebase.__firestoreDb) {
      try {
        globalForFirebase.__firestoreDb = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e: any) {
        // Fallback to getFirestore if already initialized or error occurs
        globalForFirebase.__firestoreDb = getFirestore(app);
      }
    }
    
    // Safety check: Ensure firestore is a valid object from the SDK
    const fs = globalForFirebase.__firestoreDb;
    firestore = fs || null;

  } catch (error) {
    console.error("Critical Firebase Initialization Error:", error);
  }

  return { firebaseApp: app, auth, firestore };
}
