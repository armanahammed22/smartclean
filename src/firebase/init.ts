
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
 * Hardened to ensure Firestore is always returned as a valid instance or null.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  try {
    // 1. Initialize App
    if (!globalForFirebase.__firebaseApp) {
      if (getApps().length > 0) {
        globalForFirebase.__firebaseApp = getApp();
      } else {
        globalForFirebase.__firebaseApp = initializeApp(firebaseConfig);
      }
    }

    const app = globalForFirebase.__firebaseApp;
    if (!app) return { firebaseApp: null, auth: null, firestore: null };

    // 2. Initialize Auth
    if (!globalForFirebase.__firebaseAuth) {
      globalForFirebase.__firebaseAuth = getAuth(app);
    }

    // 3. Initialize Firestore with stable transport (Long Polling)
    if (!globalForFirebase.__firestoreDb) {
      try {
        // We use initializeFirestore to set the transport layer before any other call
        globalForFirebase.__firestoreDb = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e: any) {
        // If already initialized (common during HMR), grab the existing instance
        globalForFirebase.__firestoreDb = getFirestore(app);
      }
    }

    // Heuristic check: Ensure we didn't get a partial object
    const fs = globalForFirebase.__firestoreDb;
    const isFsValid = fs && (fs as any).type === 'firestore';

    return { 
      firebaseApp: app || null, 
      auth: globalForFirebase.__firebaseAuth || null, 
      firestore: isFsValid ? fs : null 
    };
  } catch (error) {
    console.error("Critical Firebase Initialization Error:", error);
    return { firebaseApp: null, auth: null, firestore: null };
  }
}
