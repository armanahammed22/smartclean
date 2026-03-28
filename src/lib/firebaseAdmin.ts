
import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initializer (Production Ready)
 * Handles multiline private keys and prevents build-time crashes.
 */

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Log warning instead of crashing to allow Next.js build to complete
    if (process.env.NODE_ENV === 'production') {
      console.warn('Firebase Admin environment variables are missing. Server-side features will be unavailable.');
    }
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
};

const adminApp = getAdminApp();

// Export initialized services or null if initialization failed
export const db = adminApp ? adminApp.firestore() : null as any;
export const auth = adminApp ? adminApp.auth() : null as any;
