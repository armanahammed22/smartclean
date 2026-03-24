
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
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    if (!firebaseApp) {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }

    if (firebaseApp && !auth) {
      auth = getAuth(firebaseApp);
    }

    if (firebaseApp && !firestore) {
      try {
        firestore = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache(),
        });
      } catch (e: any) {
        // Fallback if already initialized (common during development reloads)
        firestore = getFirestore(firebaseApp);
      }
    }
  } catch (error) {
    console.error("Critical Firebase Initialization Error:", error);
  }

  return { firebaseApp, auth, firestore };
}
