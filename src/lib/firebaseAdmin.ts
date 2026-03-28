import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initializer (Production Ready)
 * Handles multiline private keys and prevents build-time crashes on Vercel.
 */

const getAdminApp = () => {
  // Return already initialized app if available
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Handle multiline private key from environment variables
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Safety check for production build time
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Firebase Admin variables missing. Server features (API/Sitemap) will be limited.');
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
    console.error('Firebase Admin initialization failure:', error);
    return null;
  }
};

const adminApp = getAdminApp();

// Export initialized services or null if vars are missing
export const db = adminApp ? adminApp.firestore() : null as any;
export const auth = adminApp ? adminApp.auth() : null as any;
