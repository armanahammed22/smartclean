'use client';

/**
 * Firebase Module Entry Point
 * Provides centralized access to Firebase hooks and providers.
 */

export * from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { FirebaseClientProvider } from './client-provider';
export { FirebaseProvider } from './provider';
export { initializeFirebase } from './init';
export { firebaseConfig } from './config';