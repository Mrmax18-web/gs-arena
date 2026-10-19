import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  systemConfigConverter,
  backgroundConfigConverter,
  appearanceConfigConverter,
} from '../lib/converters';
import { SystemConfig, BackgroundConfig, AppearanceConfig } from '../types/config';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/constants';
import { ContactMessageInput } from '../lib/validators';

export async function getSystemConfig(): Promise<SystemConfig> {
  if (!db) return DEFAULT_SYSTEM_CONFIG;
  try {
    const snap = await getDoc(
      doc(db, 'config', 'system').withConverter(systemConfigConverter)
    );
    if (snap.exists() && snap.data()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('System config fetch fallback to local defaults:', e);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

export async function getAppearanceConfig(): Promise<AppearanceConfig> {
  if (!db) return DEFAULT_SYSTEM_CONFIG.appearance || {};
  try {
    const snap = await getDoc(
      doc(db, 'config', 'appearance').withConverter(appearanceConfigConverter)
    );
    if (snap.exists() && snap.data()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Appearance config fetch fallback to local defaults:', e);
  }
  return DEFAULT_SYSTEM_CONFIG.appearance || {};
}

export async function saveAppearanceConfig(cfg: Partial<AppearanceConfig>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'config', 'appearance').withConverter(appearanceConfigConverter);
  await setDoc(ref, cfg as AppearanceConfig, { merge: true });

  // Sync to config/system for backwards compatibility
  try {
    const sysRef = doc(db, 'config', 'system').withConverter(systemConfigConverter);
    await setDoc(sysRef, { appearance: cfg as AppearanceConfig } as any, { merge: true });
  } catch (e) {
    console.warn('Syncing appearance to config/system skipped:', e);
  }
}

export async function saveSystemConfig(cfg: Partial<SystemConfig>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'config', 'system').withConverter(systemConfigConverter);
  await setDoc(ref, cfg as SystemConfig, { merge: true });
}

export async function saveBackgroundConfig(cfg: Partial<BackgroundConfig>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'config', 'background').withConverter(backgroundConfigConverter);
  await setDoc(ref, cfg as BackgroundConfig, { merge: true });
}

export async function submitContactMessage(input: ContactMessageInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const colRef = collection(db, 'contactMessages');
  const newDoc = doc(colRef);
  await setDoc(newDoc, {
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    createdAt: new Date().toISOString(),
  });
  return newDoc.id;
}
