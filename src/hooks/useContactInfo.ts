import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_CONTACT_INFO, type ContactInfo } from '../lib/contactDefaults';

const LOCAL_CONTACT_STORAGE_KEY = 'ttp_contact_info';

function getStoredContact(): ContactInfo {
  try {
    const raw = localStorage.getItem(LOCAL_CONTACT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACT_INFO;
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || DEFAULT_CONTACT_INFO.email,
      instagram: parsed.instagram ?? DEFAULT_CONTACT_INFO.instagram,
      instagramUrl: parsed.instagramUrl ?? DEFAULT_CONTACT_INFO.instagramUrl,
      whatsappCommunity: parsed.whatsappCommunity ?? DEFAULT_CONTACT_INFO.whatsappCommunity,
      phoneNumbers: Array.isArray(parsed.phoneNumbers) && parsed.phoneNumbers.length > 0
        ? parsed.phoneNumbers
        : DEFAULT_CONTACT_INFO.phoneNumbers,
      discord: parsed.discord || '',
      discordUrl: parsed.discordUrl || '',
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
    };
  } catch {
    return DEFAULT_CONTACT_INFO;
  }
}

export function useContactInfo() {
  const [contact, setContact] = useState<ContactInfo>(() => getStoredContact());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const contactRef = doc(db, 'config', 'contact');
      const unsubscribe = onSnapshot(
        contactRef,
        (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const data = snap.data() as Partial<ContactInfo>;
            const merged: ContactInfo = {
              email: data.email || DEFAULT_CONTACT_INFO.email,
              instagram: data.instagram ?? DEFAULT_CONTACT_INFO.instagram,
              instagramUrl: data.instagramUrl ?? DEFAULT_CONTACT_INFO.instagramUrl,
              whatsappCommunity: data.whatsappCommunity ?? DEFAULT_CONTACT_INFO.whatsappCommunity,
              phoneNumbers: Array.isArray(data.phoneNumbers) && data.phoneNumbers.length > 0
                ? data.phoneNumbers
                : DEFAULT_CONTACT_INFO.phoneNumbers,
              discord: data.discord || '',
              discordUrl: data.discordUrl || '',
              updatedAt: data.updatedAt,
              updatedBy: data.updatedBy,
            };
            setContact(merged);
            try {
              localStorage.setItem(LOCAL_CONTACT_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // Ignore local storage error
            }
          } else {
            // Document doesn't exist yet, keep stored or default
            const local = getStoredContact();
            setContact(local);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Notice loading contact info from Firestore:', error?.message || error);
          if (isMounted) {
            setContact(getStoredContact());
            setLoading(false);
          }
        }
      );

      const handleStorageUpdate = () => {
        if (isMounted) {
          setContact(getStoredContact());
        }
      };
      window.addEventListener('ttp_contact_updated', handleStorageUpdate);
      window.addEventListener('storage', handleStorageUpdate);

      return () => {
        isMounted = false;
        unsubscribe();
        window.removeEventListener('ttp_contact_updated', handleStorageUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    } catch (err) {
      console.warn('Firestore subscription prevented:', err);
      setContact(getStoredContact());
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
  }, []);

  return { contact, loading };
}

export async function saveContactInfo(data: ContactInfo): Promise<void> {
  // 1. Update local storage immediately
  try {
    localStorage.setItem(LOCAL_CONTACT_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ttp_contact_updated', { detail: data }));
  } catch (err) {
    console.warn('Failed to cache contact info locally:', err);
  }

  // 2. Persist to Firestore
  try {
    const contactRef = doc(db, 'config', 'contact');
    await setDoc(contactRef, data, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc notice for /config/contact:', err);
    throw err;
  }
}
