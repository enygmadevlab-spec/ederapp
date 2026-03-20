import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy initialization to avoid prerendering issues
let app: any;

function getFirebaseApp() {
  if (typeof window === 'undefined') {
    // Don't initialize on server-side (prerendering)
    return null;
  }
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

// For backward compatibility - export lazy getters
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();
