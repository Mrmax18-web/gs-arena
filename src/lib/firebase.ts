import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from "firebase/analytics";

// Hardcoded Firebase Configuration with the new API Key
const firebaseConfig = {
  apiKey: "AIzaSyBDTFbtp3ER_QtORXW94uUaXuM5GBRShiU",
  authDomain: "gs-arena.firebaseapp.com",
  databaseURL: "https://gs-arena-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gs-arena",
  storageBucket: "gs-arena.firebasestorage.app",
  messagingSenderId: "975047009630",
  appId: "1:975047009630:web:d1b335070e05dd36391bcf",
  measurementId: "G-7SDQ4C0C8K"
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  try {
    // experimentalAutoDetectLongPolling fixes the WebChannel transport errors on Vercel
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(app);
  }
  
  functions = getFunctions(app);
  storage = getStorage(app);

  // Safely initialize analytics only in the browser
  try {
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn('Firebase Analytics could not be initialized:', error);
  }

  // Emulators are disabled for production
  const useEmulators = false; 
  if (useEmulators) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.info('Connected to Firebase Emulators');
    } catch {
      // Ignored
    }
  }
}

export { app, auth, db, functions, storage, analytics };