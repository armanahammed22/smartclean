'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    // Use experimentalForceLongPolling for stability in restricted network environments
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

// Singleton instances for shared hooks
const initialized = initializeFirebase();
export const auth = initialized.auth;
export const db = initialized.firestore;

// Export all providers and hooks from central index
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { FirebaseClientProvider } from './client-provider';
export { FirebaseProvider } from './provider';
export * from "./config"
