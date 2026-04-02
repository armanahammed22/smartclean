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

  // Safety check for production build time
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Firebase Admin variables missing. Server features (API/Sitemap) will be limited.');
    }
    return null;
  }

  // Handle multiline private key and potential wrapping quotes from environment variables
  try {
    if (privateKey) {
      // Remove literal quotes if they exist at start/end
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

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
export const db = adminApp ? adminApp.firestore() : null;
export const auth = adminApp ? adminApp.auth() : null;
