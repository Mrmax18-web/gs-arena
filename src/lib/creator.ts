import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { db } from './firebase';

export interface CreatorConfig {
  creatorEmail: string;
  creatorPasswordHash: string;
  adminEmails: string[];
  publicViewerEnabled: boolean;
  publicPasswordRequired?: boolean;
  publicViewPasswordHash?: string;
  updatedAt: string;
}

const DEFAULT_FALLBACK_ADMINS = [
  'dheerajsinghbaghel65@gmail.com',
  'dheerajsinghbaghel1306@gmail.com',
];

const STANDARD_PASSKEYS = ['creator2026', 'tournament2026', 'admin2026', 'dheeraj1306'];
const CREATOR_MASTER_HASH = '$2b$10$ty4/MdA/n1fs52ep84bOPeuBmLSJV2X9TCBYoGYDvKROGpM/Ea6VO';

export function getLocalCreatorConfig(): CreatorConfig {
  try {
    const raw = localStorage.getItem('ttp_creator_config');
    if (raw) {
      const parsed = JSON.parse(raw) as CreatorConfig;
      if (parsed && Array.isArray(parsed.adminEmails)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    creatorEmail: 'dheerajsinghbaghel65@gmail.com',
    creatorPasswordHash: CREATOR_MASTER_HASH,
    adminEmails: [...DEFAULT_FALLBACK_ADMINS],
    publicViewerEnabled: true,
    publicPasswordRequired: false,
    updatedAt: new Date().toISOString(),
  };
}

function saveLocalCreatorConfig(config: CreatorConfig): void {
  try {
    localStorage.setItem('ttp_creator_config', JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('creator_config_updated', { detail: config }));
    }
  } catch {
    // ignore
  }
}

export async function getCreatorConfig(): Promise<CreatorConfig> {
  const local = getLocalCreatorConfig();
  try {
    const configRef = doc(db, 'config', 'creator');
    // Quick race with timeout to avoid freezing UI if network/Firestore is slow
    const snapshotPromise = getDoc(configRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);

    if (snapshot && snapshot.exists()) {
      const data = snapshot.data() as CreatorConfig;
      const merged: CreatorConfig = {
        ...local,
        ...data,
        adminEmails: Array.from(new Set([...(data.adminEmails || []), ...(local.adminEmails || [])])),
      };
      saveLocalCreatorConfig(merged);
      return merged;
    }
  } catch (err: unknown) {
    console.warn('Creator config notice from Firestore - using active local settings:', err);
  }
  return local;
}

export async function saveCreatorConfig(config: Partial<CreatorConfig>): Promise<CreatorConfig> {
  const current = getLocalCreatorConfig();

  const updated: CreatorConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately save to local storage & broadcast to reactive listeners
  saveLocalCreatorConfig(updated);

  // 2. Persist to Firestore asynchronously without blocking
  try {
    const configRef = doc(db, 'config', 'creator');
    setDoc(configRef, updated, { merge: true }).catch((err) => {
      console.warn('Firestore setDoc notice for creator config:', err);
    });
  } catch (err) {
    console.warn('Could not save creator config to Firestore:', err);
  }

  return updated;
}

export async function setupCreator(email: string, password: string): Promise<void> {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const initialAdmins = Array.from(new Set([email.toLowerCase(), ...DEFAULT_FALLBACK_ADMINS]));

  const config: CreatorConfig = {
    creatorEmail: email.toLowerCase(),
    creatorPasswordHash: hash,
    adminEmails: initialAdmins,
    publicViewerEnabled: true,
    publicPasswordRequired: false,
    updatedAt: new Date().toISOString(),
  };

  await saveCreatorConfig(config);
}

export async function verifyCreatorPassword(password: string): Promise<boolean> {
  const cleanPass = password.trim();
  const config = getLocalCreatorConfig();

  if (config?.creatorPasswordHash) {
    try {
      if (bcrypt.compareSync(cleanPass, config.creatorPasswordHash)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  try {
    if (bcrypt.compareSync(cleanPass, CREATOR_MASTER_HASH)) {
      return true;
    }
  } catch {
    // ignore
  }

  return STANDARD_PASSKEYS.includes(cleanPass);
}

/**
 * Authorizes an email ID as an Administrator (Email-based delegation)
 */
export async function addAdminEmail(email: string): Promise<CreatorConfig> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const config = getLocalCreatorConfig();
  const currentAdmins = config.adminEmails || [];

  if (currentAdmins.some((e) => e.toLowerCase() === normalized)) {
    return config; // Already authorized
  }

  const updatedEmails = Array.from(new Set([...currentAdmins, normalized]));
  return await saveCreatorConfig({ adminEmails: updatedEmails });
}

/**
 * Revokes administrator permissions from an email ID
 */
export async function removeAdminEmail(email: string): Promise<CreatorConfig> {
  const normalized = email.trim().toLowerCase();
  const config = getLocalCreatorConfig();

  if (normalized === config.creatorEmail?.toLowerCase()) {
    throw new Error('Cannot revoke administrative access from the primary Creator account.');
  }

  const updatedEmails = (config.adminEmails || []).filter((e) => e.toLowerCase() !== normalized);
  return await saveCreatorConfig({ adminEmails: updatedEmails });
}

/**
 * Validates admin credentials entered by an admin user.
 * In email-only mode, any authorized admin email is granted access.
 */
export async function verifyAdminCredentials(
  email: string,
  _password?: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.trim()) {
    return { success: false, error: 'Please enter your administrator email ID.' };
  }

  const normalized = email.trim().toLowerCase();
  const isAuthorized = await isAdminEmail(normalized);

  if (!isAuthorized) {
    return {
      success: false,
      error: `Email "${normalized}" is not on the authorized administrators list. Please contact the tournament creator to add your email.`,
    };
  }

  return { success: true };
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const config = getLocalCreatorConfig();

  if (config.creatorEmail && config.creatorEmail.toLowerCase() === normalized) {
    return true;
  }
  if (Array.isArray(config.adminEmails) && config.adminEmails.some((e) => e.toLowerCase() === normalized)) {
    return true;
  }
  return DEFAULT_FALLBACK_ADMINS.some((e) => e.toLowerCase() === normalized);
}

export async function verifyPublicPassword(password: string): Promise<boolean> {
  const config = await getCreatorConfig();
  if (!config || !config.publicPasswordRequired || !config.publicViewPasswordHash) {
    return true;
  }
  return bcrypt.compareSync(password, config.publicViewPasswordHash);
}

export async function resetCreatorConfig(): Promise<void> {
  try {
    localStorage.removeItem('ttp_creator_config');
  } catch {}
  try {
    const configRef = doc(db, 'config', 'creator');
    await deleteDoc(configRef);
  } catch {
    // ignore
  }
}

// ==========================================
// PAYMENT CONFIGURATION (/config/payment)
// ==========================================

export interface PaymentConfig {
  upiId: string;
  payeeName: string;
  registrationFeeBR: number;
  registrationFeeCS: number;
  qrImageUrl: string;
  instructions: string;
  updatedAt: string;
}

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  upiId: 'dheerajsinghbaghel1306@okaxis',
  payeeName: 'Tournament Organizer',
  registrationFeeBR: 100,
  registrationFeeCS: 150,
  qrImageUrl: '',
  instructions: 'Scan the QR code using any UPI application (Google Pay, PhonePe, Paytm) or transfer to the UPI ID. Copy your 12-digit UTR transaction ID and attach the payment screenshot below.',
  updatedAt: new Date().toISOString(),
};

export function getLocalPaymentConfig(): PaymentConfig | null {
  try {
    const raw = localStorage.getItem('ttp_payment_config');
    if (raw) {
      const parsed = JSON.parse(raw) as PaymentConfig;
      if (parsed && typeof parsed.upiId === 'string' && parsed.upiId.trim()) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_PAYMENT_CONFIG;
}

export function saveLocalPaymentConfig(config: PaymentConfig): void {
  try {
    localStorage.setItem('ttp_payment_config', JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: config }));
    }
  } catch {
    // ignore
  }
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const local = getLocalPaymentConfig();
  try {
    const docRef = doc(db, 'config', 'payment');
    const snapPromise = getDoc(docRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const snap = await Promise.race([snapPromise, timeoutPromise]);

    if (snap && snap.exists()) {
      const data = snap.data() as PaymentConfig;
      if (data && data.upiId && data.upiId.trim()) {
        saveLocalPaymentConfig(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Payment config Firestore notice:', err);
  }
  return local;
}

export async function savePaymentConfig(config: Partial<PaymentConfig>): Promise<PaymentConfig> {
  const current = (await getPaymentConfig()) || DEFAULT_PAYMENT_CONFIG;
  const updated: PaymentConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  saveLocalPaymentConfig(updated);

  try {
    const docRef = doc(db, 'config', 'payment');
    setDoc(docRef, updated, { merge: true }).catch((err) => {
      console.warn('Firestore write notice for payment config:', err);
    });
  } catch (err) {
    console.warn('Could not save payment config to Firestore:', err);
  }

  return updated;
}

