'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Initializes Firebase and returns the required service instances.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    // Initialize Firestore with specific settings to ensure stability in various environments
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } else {
    app = getApp();
  }

  const authInstance = getAuth(app);
  const firestoreInstance = getFirestore(app);

  return { 
    firebaseApp: app, 
    auth: authInstance, 
    firestore: firestoreInstance 
  };
}

/**
 * Singleton instances for internal firebase folder usage (e.g., hooks)
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Barrel exports for consistent usage throughout the app
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { FirebaseClientProvider } from './client-provider';
