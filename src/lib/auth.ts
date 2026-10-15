import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { isAdminEmail as checkIsAdminEmail, verifyAdminCredentials } from './creator';

const SESSION_STORAGE_KEY = 'ttr_auth_session_user';
const authListeners = new Set<(user: User | null) => void>();

export function createSessionUser(
  email: string,
  displayName?: string
): User {
  const normalizedEmail = email.trim().toLowerCase();
  const name =
    displayName ||
    normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    uid: 'admin-user-' + Math.random().toString(36).substring(2, 9),
    email: normalizedEmail,
    displayName: name,
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: 'session-token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'jwt-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'password',
  } as unknown as User;
}

export function getLocalSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveLocalSession(user: User): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // storage might be restricted
  }
}

export function clearLocalSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function notifyAuthListeners(user: User | null) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

/**
 * Sign in using authorized Admin Email
 */
export async function signInWithAdminEmail(
  email: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result = await verifyAdminCredentials(email);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const user = createSessionUser(email);
  saveLocalSession(user);
  notifyAuthListeners(user);
  return { success: true, user };
}

/**
 * Backward compatibility alias for Admin email sign-in
 */
export async function signInWithAdminCredentials(
  email: string,
  _password?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  return signInWithAdminEmail(email);
}

export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error('Google Sign-In is unavailable. Please sign in directly with your authorized Admin Email ID.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    saveLocalSession(result.user);
    notifyAuthListeners(result.user);
    return result.user;
  } catch (error: any) {
    console.warn('Firebase signInWithPopup note:', error?.message || error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  clearLocalSession();
  if (isFirebaseConfigured) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase signOut note:', err);
    }
  }
  notifyAuthListeners(null);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  return checkIsAdminEmail(email);
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  authListeners.add(callback);
  const existingLocal = getLocalSessionUser();
  if (existingLocal) {
    setTimeout(() => callback(existingLocal), 0);
  } else if (!isFirebaseConfigured) {
    setTimeout(() => callback(null), 0);
  }

  let firebaseUnsubscribe: Unsubscribe = () => {};
  if (isFirebaseConfigured) {
    try {
      firebaseUnsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            saveLocalSession(user);
            callback(user);
          } else if (!getLocalSessionUser()) {
            callback(null);
          }
        },
        (error) => {
          console.warn('Firebase Auth state listener handled:', error?.message || error);
          if (!getLocalSessionUser()) {
            callback(null);
          }
        }
      );
    } catch (err) {
      console.warn('onAuthStateChanged initialization prevented:', err);
      if (!getLocalSessionUser()) {
        setTimeout(() => callback(null), 0);
      }
    }
  }

  return () => {
    authListeners.delete(callback);
    firebaseUnsubscribe();
  };
}
