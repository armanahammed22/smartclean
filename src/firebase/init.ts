'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Singleton instances to persist across re-renders/hot-reloads
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Ensures initializeFirestore is only called once per app lifecycle.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  if (typeof window !== 'undefined') {
    // 1. Initialize App
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    // 2. Initialize Firestore with stability settings
    // We try to get the existing instance first to avoid "already initialized" errors
    try {
      db = getFirestore(app);
    } catch (e) {
      // If getFirestore fails (e.g. not yet initialized), we initialize it with forced long polling.
      // Forced long polling is essential for stability in restricted network environments like Studio.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    }
    
    // 3. Initialize Auth
    auth = getAuth(app);
  }

  return { 
    firebaseApp: app, 
    auth: auth, 
    firestore: db 
  };
}
