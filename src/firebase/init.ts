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
       * forceLongPolling: Bypass faulty streaming in workstation/proxy.
       * memoryLocalCache: Avoid persistence-related assertion failures in shared environments.
       */
      firestore = initializeFirestore(firebaseApp, {
        forceLongPolling: true,
        localCache: memoryLocalCache(),
      });
    }
  } catch (error) {
    console.warn("[Firebase Init] Initialization issue:", error);
    if (firebaseApp && !firestore) {
      try {
        // Fallback to basic getter if initializeFirestore fails
        firestore = getFirestore(firebaseApp);
      } catch (e) {
        console.error("[Firebase Init] Critical Failure:", e);
      }
    }
  }

  return { firebaseApp, auth, firestore };
}
