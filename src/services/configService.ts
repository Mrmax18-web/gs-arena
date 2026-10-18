import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  systemConfigConverter,
  backgroundConfigConverter,
} from '../lib/converters';
import { SystemConfig, BackgroundConfig } from '../types/config';
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
