import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, isFirebaseConfigured } from '../lib/firebase';
import { AdminApplicationInput } from '../lib/validators';
import { UserRole } from '../types/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  isCreator: boolean;
  loading: boolean;
  claimsLoaded: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  ensureAnonymousUser: () => Promise<User>;
  applyForAdmin: (data: AdminApplicationInput) => Promise<void>;
  claimCreator: (code: string) => Promise<{ success: boolean; message?: string }>;
  refreshRole: () => Promise<UserRole>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('public');
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isCreatorUser, setIsCreatorUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimsLoaded, setClaimsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const extractClaims = useCallback(async (firebaseUser: User) => {
    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      const claims = tokenResult.claims;
      const isCreatorClaim = Boolean(claims.creator === true || claims.role === 'creator');
      const isAdminClaim = Boolean(claims.admin === true || claims.role === 'admin' || isCreatorClaim);
      const resolvedRole: UserRole = isCreatorClaim ? 'creator' : isAdminClaim ? 'admin' : 'public';
      return { role: resolvedRole, isAdmin: isAdminClaim, isCreator: isCreatorClaim };
    } catch (e) {
      console.warn('Failed to parse user claims:', e);
      return { role: 'public' as UserRole, isAdmin: false, isCreator: false };
    }
  }, []);

  const refreshRole = useCallback(async (): Promise<UserRole> => {
    if (!auth?.currentUser) {
      setRole('public');
      setIsAdminUser(false);
      setIsCreatorUser(false);
      setClaimsLoaded(true);
      return 'public';
    }
    try {
      // Force token refresh from Firebase Auth backend
      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      const claims = tokenResult.claims;
      const isCreatorClaim = Boolean(claims.creator === true || claims.role === 'creator');
      const isAdminClaim = Boolean(claims.admin === true || claims.role === 'admin' || isCreatorClaim);
      const resolvedRole: UserRole = isCreatorClaim ? 'creator' : isAdminClaim ? 'admin' : 'public';

      setRole(resolvedRole);
      setIsAdminUser(isAdminClaim);
      setIsCreatorUser(isCreatorClaim);
      setClaimsLoaded(true);
      return resolvedRole;
    } catch (e: any) {
      console.warn('Role refresh failed:', e?.message);
      setRole('public');
      setIsAdminUser(false);
      setIsCreatorUser(false);
      setClaimsLoaded(true);
      return 'public';
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      setClaimsLoaded(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const claims = await extractClaims(currentUser);
        setRole(claims.role);
        setIsAdminUser(claims.isAdmin);
        setIsCreatorUser(claims.isCreator);
      } else {
        setRole('public');
        setIsAdminUser(false);
        setIsCreatorUser(false);
      }
      setClaimsLoaded(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [extractClaims]);

  const signIn = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth not configured');
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const claims = await extractClaims(cred.user);
      setRole(claims.role);
      setIsAdminUser(claims.isAdmin);
      setIsCreatorUser(claims.isCreator);
      setClaimsLoaded(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in';
      setError(msg);
      throw err;
    }
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    if (!auth || !db) throw new Error('Firebase not configured');
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Create user mirror doc with role 'public'
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || null,
        role: 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setRole('public');
      setIsAdminUser(false);
      setIsCreatorUser(false);
      setClaimsLoaded(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign up';
      setError(msg);
      throw err;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    setError(null);
    try {
      await fbSignOut(auth);
      setUser(null);
      setRole('public');
      setIsAdminUser(false);
      setIsCreatorUser(false);
      setClaimsLoaded(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out');
    }
  };

  const ensureAnonymousUser = async (): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth not configured');
    if (auth.currentUser) return auth.currentUser;

    const cred = await signInAnonymously(auth);
    return cred.user;
  };

  const applyForAdmin = async (data: AdminApplicationInput) => {
    if (!db || !auth?.currentUser) {
      throw new Error('You must be signed in with an account to apply for Admin status.');
    }
    const uid = auth.currentUser.uid;
    const reqDoc = {
      uid,
      name: data.name,
      email: data.email,
      reason: data.reason,
      contact: data.contact,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'adminRequests', uid), reqDoc);
  };

  const claimCreator = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!functions) {
      throw new Error('Firebase functions not configured');
    }

    // Ensure there is an authenticated session (anonymous or registered) to associate custom claims
    if (!auth?.currentUser) {
      await ensureAnonymousUser();
    }

    try {
      const claimFn = httpsCallable<{ code: string }, { success: boolean; message?: string }>(
        functions,
        'claimCreator'
      );
      const res = await claimFn({ code });
      if (res.data?.success) {
        // Force token refresh from backend to immediately retrieve new creator claims
        await refreshRole();
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Invalid access code' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Callable function error' };
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin: isAdminUser,
        isCreator: isCreatorUser,
        loading,
        claimsLoaded,
        error,
        signIn,
        signUp,
        signOut,
        ensureAnonymousUser,
        applyForAdmin,
        claimCreator,
        refreshRole,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
