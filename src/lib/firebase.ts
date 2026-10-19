import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here'
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(app);
  }
  functions = getFunctions(app);
  storage = getStorage(app);

  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.info('Connected to Firebase Emulators');
    } catch {
      // Ignored if already connected or in re-render
    }
  }
}

export { app, auth, db, functions, storage };

