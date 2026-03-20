'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Singleton instances to persist across re-renders/hot-reloads
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Ensures initializeFirestore is only called once per app lifecycle with stability settings.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null as any, auth: null as any, firestore: null as any };
  }

  // 1. Initialize App
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  }

  // 2. Initialize Firestore with stability settings
  if (!db) {
    try {
      // In cloud workstation environments, we use forced long polling and memory cache.
      // Persistence (IndexedDB) can often lead to "Unexpected state" assertion errors
      // during hot reloads or proxied stream disruptions.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      });
    } catch (e) {
      // If initializeFirestore fails (e.g. instance already exists), 
      // fallback to retrieving the existing instance.
      db = getFirestore(app);
    }
  }
  
  // 3. Initialize Auth
  if (!auth) {
    auth = getAuth(app);
  }

  return { 
    firebaseApp: app, 
    auth: auth, 
    firestore: db 
  };
}
