
import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initializer
 * Specifically designed for server-side use only.
 */

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
      });
    } else {
      console.warn('Firebase Admin environment variables are missing. Some server features may not work.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
