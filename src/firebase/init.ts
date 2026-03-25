'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Robust singleton pattern for Next.js.
 * Forces Long Polling and Memory Cache to permanently eliminate ca9/b815 assertion errors
 * common in proxy/workstation environments.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    if (!firebaseApp) {
      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        firebaseApp = initializeApp(firebaseConfig);
      }
      
      auth = getAuth(firebaseApp);
      
      /**
       * 🛡️ PERMANENT FIRESTORE FIX
       * forceLongPolling: true - Required to bypass faulty streaming in Cloud Workstations.
       * memoryLocalCache: Required to avoid IndexDB assertion failures in dev-mode workstation loops.
       */
      firestore = initializeFirestore(firebaseApp, {
        forceLongPolling: true,
        localCache: memoryLocalCache(),
      });
    }
  } catch (error) {
    // If initializeFirestore was already called, fallback to getFirestore
    if (!firestore && firebaseApp) {
      firestore = getFirestore(firebaseApp);
    }
  }

  return { firebaseApp, auth, firestore };
}
