'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Singleton instances to persist across re-renders/hot-reloads
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firestoreDb: Firestore | undefined;

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Handles both Client and Server environments gracefully.
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

  // 2. Initialize Firestore with stability settings
  if (!firestoreDb) {
    if (typeof window !== 'undefined') {
      // Client-side: use forced long polling and memory cache for environment stability
      try {
        firestoreDb = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e) {
        // Fallback if already initialized by another process
        firestoreDb = getFirestore(firebaseApp);
      }
    } else {
      // Server-side: standard initialization for API routes
      firestoreDb = getFirestore(firebaseApp);
    }
  }
  
  // 3. Initialize Auth
  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
  }

  return { 
    firebaseApp: firebaseApp, 
    auth: firebaseAuth, 
    firestore: firestoreDb 
  };
}
