
'use client';

import { initializeFirebase } from '@/firebase/init';

/**
 * Shared Client-side Firebase Services
 */
const services = initializeFirebase();

export const firebaseApp = services.firebaseApp;
export const auth = services.auth;
export const firestore = services.firestore;
