
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
 * Ensures initialization happens exactly once and only in the browser.
 * Hardened with experimentalForceLongPolling to avoid internal transport errors (ca9).
 * The 'ca9' error is specifically related to the WebChannel state machine.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    } else {
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      
      // Force long polling to bypass faulty WebChannel behavior in proxy/workstation environments
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      });
    }
  } catch (error) {
    console.error("Critical Firebase Initialization Error:", error);
    // Attempt fallback
    if (firebaseApp) {
      firestore = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
    }
  }

  return { firebaseApp, auth, firestore };
}
