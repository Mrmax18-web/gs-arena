import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
// Note: You can remove the storage import if you have fully migrated to Supabase
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

// Hardcoded Firebase Configuration (Bypasses Vercel Env Vars issue)
const firebaseConfig = {
  apiKey: "AIzaSyAdEmc9t6lu4hcZXmfgyPLVQ6IR9T5C0dM",
  authDomain: "gs-arena.firebaseapp.com",
  projectId: "gs-arena",
  storageBucket: "gs-arena.firebasestorage.app",
  messagingSenderId: "975047009630",
  appId: "1:975047009630:web:05bc86474a33e961391bcf",
  measurementId: "G-7YFTS2VNXC"
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
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

  // Emulators disabled for production deployment
  const useEmulators = false; // Hardcoded to false
  if (useEmulators) {
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