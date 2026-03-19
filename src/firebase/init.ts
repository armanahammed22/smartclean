'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Idempotent Firebase initialization.
 * Returns core service instances for the application.
 * Only intended for use within Client Components.
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
