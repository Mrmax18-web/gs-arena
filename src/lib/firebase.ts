import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const env = import.meta.env;

const rawApiKey = env.VITE_FIREBASE_API_KEY as string | undefined;

export const isFirebaseConfigured: boolean = Boolean(
  rawApiKey &&
    !rawApiKey.toLowerCase().includes('dummy') &&
    !rawApiKey.toLowerCase().includes('your-api-key') &&
    rawApiKey !== 'AIzaSyDummyKeyForTournamentTrackerProd'
);

const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyDummyKeyForTournamentTrackerProd',
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'tournament-tracker-prod.firebaseapp.com',
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string) || 'tournament-tracker-prod',
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'tournament-tracker-prod.appspot.com',
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '123456789012',
  appId: (env.VITE_FIREBASE_APP_ID as string) || '1:123456789012:web:abcdef123456',
};

/**
 * Verifies every required VITE_FIREBASE_* variable is present.
 */
export function assertConfig(): void {
  const required: [string, string | undefined][] = [
    ['VITE_FIREBASE_API_KEY', rawApiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN],
    ['VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID],
    ['VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID],
  ];
  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.warn(
      `[firebase] Missing Firebase config in .env: ${missing.join(', ')}. Using local/fallback config.`,
    );
  }
}

assertConfig();

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use long-polling for AI Studio sandbox and unstable connection compatibility
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    ...({ useFetchStreams: false } as Record<string, unknown>),
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const googleAuthProvider: GoogleAuthProvider = googleProvider;
googleProvider.setCustomParameters({ prompt: 'select_account' });

console.log('[firebase] Initialized:', firebaseConfig.projectId);

