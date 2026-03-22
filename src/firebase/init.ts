'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Robust singleton pattern for Next.js HMR.
 * Storing instances on globalThis ensures they persist across module reloads
 * in the development environment, preventing multiple initializations.
 */
const globalForFirebase = globalThis as unknown as {
  __firebaseApp: FirebaseApp | undefined;
  __firebaseAuth: Auth | undefined;
  __firestoreDb: Firestore | undefined;
};

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Ensures only one instance of each service exists.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  // 1. Initialize App
  if (!globalForFirebase.__firebaseApp) {
    if (getApps().length > 0) {
      globalForFirebase.__firebaseApp = getApp();
    } else {
      globalForFirebase.__firebaseApp = initializeApp(firebaseConfig);
    }
  }

  // 2. Initialize Auth
  if (!globalForFirebase.__firebaseAuth) {
    globalForFirebase.__firebaseAuth = getAuth(globalForFirebase.__firebaseApp);
  }

  // 3. Initialize Firestore
  if (!globalForFirebase.__firestoreDb) {
    try {
      /**
       * CRITICAL FIX: "Unexpected state (ID: ca9)" Error.
       * In proxy-heavy environments (like Cloud Workstations/Firebase Studio), 
       * Firestore WebSockets can be unstable. Forcing Long Polling prevents 
       * the internal assertion failures during stream recovery.
       */
      globalForFirebase.__firestoreDb = initializeFirestore(globalForFirebase.__firebaseApp, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      // Fallback if initializeFirestore was already called elsewhere
      globalForFirebase.__firestoreDb = getFirestore(globalForFirebase.__firebaseApp);
    }
  }

  return { 
    firebaseApp: globalForFirebase.__firebaseApp!, 
    auth: globalForFirebase.__firebaseAuth!, 
    firestore: globalForFirebase.__firestoreDb! 
  };
}
