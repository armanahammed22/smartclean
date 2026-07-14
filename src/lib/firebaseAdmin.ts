import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initializer (Production Ready)
 * Handles multiline private keys and provides a fallback to Application Default Credentials.
 */

const getAdminApp = () => {
  // Return already initialized app if available
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  try {
    let credential;

    if (projectId && clientEmail && privateKey) {
      // Handle multiline private key and potential wrapping quotes from environment variables
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      });
    } else {
      // Fallback to Application Default Credentials if running in a Google Cloud/Firebase environment
      // or if individual keys are missing.
      try {
        credential = admin.credential.applicationDefault();
      } catch (adcError) {
        if (!process.env.NEXT_PHASE) {
          console.warn('[Firebase Admin] No valid credentials found. Server-side database features will be disabled.');
        }
        return null;
      }
    }

    return admin.initializeApp({
      credential,
      projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
    });
  } catch (error) {
    if (!process.env.NEXT_PHASE) {
      console.error('Firebase Admin initialization failure:', error);
    }
    return null;
  }
};

const adminApp = getAdminApp();

// Export initialized services or null if vars are missing
export const db = adminApp ? adminApp.firestore() : null;
export const auth = adminApp ? adminApp.auth() : null;
