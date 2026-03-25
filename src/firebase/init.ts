
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
 * Hardened with forceLongPolling to avoid internal transport errors (ca9, b815).
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
      
      // Force long polling to bypass faulty WebChannel behavior in proxy/workstation environments
      // Memory cache is used to prevent assertion failures related to indexedDB in restricted environments
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      });
    }
  } catch (error) {
    console.warn("[Firebase Init] Standard initialization failed, attempting fallback:", error);
    if (firebaseApp && !firestore) {
      try {
        firestore = getFirestore(firebaseApp);
      } catch (e) {
        console.error("[Firebase Init] Critical Failure:", e);
      }
    }
  }

  return { firebaseApp, auth, firestore };
}
