import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { AdminRequest } from '../types';
import { logAudit } from '../lib/firestore';

export function useAdminRequests(isCreator = false) {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch full list if user is creator or admin
    if (!isCreator) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const reqRef = collection(db, 'adminRequests');
    const unsub = onSnapshot(
      reqRef,
      (snapshot) => {
        const list: AdminRequest[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            email: data.email || '',
            name: data.name || '',
            reason: data.reason || '',
            requestedAt: data.requestedAt || new Date().toISOString(),
            status: data.status || 'pending',
            reviewedAt: data.reviewedAt,
            reviewedBy: data.reviewedBy,
            rejectionReason: data.rejectionReason,
          });
        });

        // Sort descending by requestedAt
        list.sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        );

        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.warn('[adminRequests] Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isCreator]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  // Submit new request (publicly accessible)
  const submitRequest = async (data: {
    email: string;
    name: string;
    reason?: string;
  }): Promise<string> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    if (!cleanEmail || !cleanName) {
      throw new Error('Name and email are required');
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newDoc: AdminRequest = {
      id,
      email: cleanEmail,
      name: cleanName,
      reason: data.reason?.trim() || '',
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    const docRef = doc(db, 'adminRequests', id);
    const writePromise = setDoc(docRef, newDoc);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request submission timed out')), 10000)
    );

    await Promise.race([writePromise, timeoutPromise]);
    await logAudit('request_admin_access', 'admin_request', id, {
      email: cleanEmail,
      name: cleanName,
    }).catch(() => {});

    return id;
  };

  // Approve request (Creator only)
  const approveRequest = async (
    requestId: string,
    requesterEmail: string
  ): Promise<void> => {
    const reviewer = auth.currentUser?.email || 'creator';

    // 1. Add email to /config/creator adminEmails list
    try {
      const creatorDocRef = doc(db, 'config', 'creator');
      const creatorSnap = await getDoc(creatorDocRef);
      if (creatorSnap.exists()) {
        await updateDoc(creatorDocRef, {
          adminEmails: arrayUnion(requesterEmail.trim().toLowerCase()),
          updatedAt: new Date().toISOString(),
          updatedBy: reviewer,
        });
      }
    } catch (err) {
      console.warn('[adminRequests] Could not update /config/creator doc:', err);
    }

    // 2. Mark request as approved
    const reqDocRef = doc(db, 'adminRequests', requestId);
    const updatePromise = updateDoc(reqDocRef, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Approval timed out')), 10000)
    );

    await Promise.race([updatePromise, timeoutPromise]);
    await logAudit('approve_admin_request', 'admin_request', requestId, {
      requesterEmail,
      reviewedBy: reviewer,
    }).catch(() => {});
  };

  // Reject request (Creator only)
  const rejectRequest = async (
    requestId: string,
    rejectionReason?: string
  ): Promise<void> => {
    const reviewer = auth.currentUser?.email || 'creator';
    const reqDocRef = doc(db, 'adminRequests', requestId);

    const updatePromise = updateDoc(reqDocRef, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
      rejectionReason: rejectionReason?.trim() || 'Not approved at this time',
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Rejection timed out')), 10000)
    );

    await Promise.race([updatePromise, timeoutPromise]);
    await logAudit('reject_admin_request', 'admin_request', requestId, {
      reviewedBy: reviewer,
      rejectionReason,
    }).catch(() => {});
  };

  return {
    requests,
    pendingCount,
    loading,
    error,
    submitRequest,
    approveRequest,
    rejectRequest,
  };
}
