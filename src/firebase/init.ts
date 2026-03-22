'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Singleton instances to persist across re-renders/hot-reloads
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firestoreDb: Firestore | undefined;

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Ensures only one instance of each service exists.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  // 1. Initialize App
  if (!firebaseApp) {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  // 2. Initialize Auth
  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
  }

  // 3. Initialize Firestore
  if (!firestoreDb) {
    try {
      /**
       * CRITICAL FIX: "Unexpected state (ID: ca9)" Error.
       * In proxy-heavy environments (like Cloud Workstations/Firebase Studio), 
       * Firestore WebSockets can be unstable. Forcing Long Polling prevents 
       * the internal assertion failures during stream recovery.
       */
      firestoreDb = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      // Fallback if initializeFirestore was already called elsewhere
      firestoreDb = getFirestore(firebaseApp);
    }
  }

  return { 
    firebaseApp: firebaseApp, 
    auth: firebaseAuth, 
    firestore: firestoreDb 
  };
}
