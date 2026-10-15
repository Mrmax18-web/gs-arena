import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthChange,
  signInWithGoogle,
  signInWithAdminEmail,
  signInWithAdminCredentials,
  signOut,
  isAdminEmail,
} from '../lib/auth';
import { AdminLoginModal } from '../components/AdminLoginModal';

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signInWithAdminEmail: (email: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signInWithAdminPassword: (email: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signInWithGoogleOAuth: () => Promise<User>;
  signIn: () => void; // Open login modal
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  const checkAdmin = async (currentUser: User | null) => {
    if (!currentUser?.email) {
      setIsAdmin(false);
      return;
    }
    try {
      const admin = await isAdminEmail(currentUser.email);
      setIsAdmin(admin);
    } catch {
      const email = currentUser.email.toLowerCase();
      const isFallbackAdmin = [
        'dheerajsinghbaghel65@gmail.com',
        'dheerajsinghbaghel1306@gmail.com',
      ].includes(email);
      setIsAdmin(isFallbackAdmin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      await checkAdmin(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const handleSignInWithAdminEmail = async (
    email: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setLoading(true);
    try {
      const res = await signInWithAdminEmail(email);
      if (res.success && res.user) {
        setUser(res.user);
        await checkAdmin(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithAdminPassword = async (
    email: string,
    _password?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    return handleSignInWithAdminEmail(email);
  };

  const handleSignInWithGoogleOAuth = async (): Promise<User> => {
    setLoading(true);
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
      await checkAdmin(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    await checkAdmin(user);
  };

  const value: AuthContextType = {
    user,
    isAdmin,
    loading,
    loginModalOpen,
    openLoginModal,
    closeLoginModal,
    signInWithAdminEmail: handleSignInWithAdminEmail,
    signInWithAdminPassword: handleSignInWithAdminPassword,
    signInWithGoogleOAuth: handleSignInWithGoogleOAuth,
    signIn: openLoginModal, // Default signIn opens the Admin Login modal
    logout: handleLogout,
    refreshAdminStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AdminLoginModal open={loginModalOpen} onClose={closeLoginModal} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
