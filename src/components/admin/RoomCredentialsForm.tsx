import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { getMatchSecrets, saveMatchSecrets } from '../../services/tournamentService';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Icon } from '@iconify/react';

interface RoomCredentialsFormProps {
  tournamentId: string;
  matchId: string;
  matchNumber: number;
}

export const RoomCredentialsForm: React.FC<RoomCredentialsFormProps> = ({
  tournamentId,
  matchId,
  matchNumber,
}) => {
  const { success, error } = useToast();
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [credentialsSentAt, setCredentialsSentAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    let unsubReg: (() => void) | undefined;

    async function loadData() {
      setLoading(true);
      try {
        const secrets = await getMatchSecrets(matchId);
        if (isMounted && secrets) {
          setRoomId(secrets.roomId || '');
          setRoomPassword(secrets.roomPassword || '');
          setCredentialsSentAt(secrets.credentialsSentAt || null);
        }

        // Real-time listener for approved registrations count
        if (db) {
          const regQ = query(
            collection(db, 'registrations'),
            where('tournamentId', '==', tournamentId),
            where('status', '==', 'approved')
          );
          unsubReg = onSnapshot(
            regQ,
            (snap) => {
              if (isMounted) {
                setRecipientCount(snap.size);
              }
            },
            (err) => {
              console.warn('Could not listen to approved registrations count:', err);
            }
          );
        }
      } catch (err) {
        console.warn('Could not load room secrets:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
      if (unsubReg) unsubReg();
    };
  }, [tournamentId, matchId]);

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !roomPassword.trim()) {
      error('Fields Required', 'Please enter both Room ID and Room Password.');
      return;
    }

    setSaving(true);
    try {
      await saveMatchSecrets(matchId, roomId.trim(), roomPassword.trim());
      success('Secrets Saved', 'Room credentials updated securely in private storage.');
    } catch (err: any) {
      error('Save Failed', err?.message || 'Failed to save room credentials.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendCredentials = async () => {
    setSending(true);
    try {
      if (!roomId.trim() || !roomPassword.trim()) {
        error('Fields Required', 'Please set Room ID and Password before dispatching.');
        return;
      }
      const now = new Date().toISOString();
      await saveMatchSecrets(matchId, roomId.trim(), roomPassword.trim());
      if (db) {
        await updateDoc(doc(db, 'matchSecrets', matchId), {
          credentialsSentAt: now,
        }).catch(() => {});
      }
      setCredentialsSentAt(now);
      success(
        'Credentials Dispatched',
        `Room credentials saved and ready for ${recipientCount} registered teams.`
      );
    } catch (err: any) {
      error('Dispatch Error', err?.message || 'Error recording credential dispatch.');
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <GlassCard strong className="p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:key-minimalistic-bold" className="text-xl text-amber-500" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Room Credentials & Private Dispatch (Match #{matchNumber})
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Credentials are encrypted in private storage and never exposed on public endpoints.
          </p>
        </div>

        {credentialsSentAt && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Icon icon="solar:check-circle-bold" />
            Sent: {new Date(credentialsSentAt).toLocaleString()}
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSecrets} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Custom Room ID"
            placeholder="e.g. 9823145"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            label="Room Password"
            placeholder="e.g. finals@2026"
            value={roomPassword}
            onChange={(e) => setRoomPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={saving}
            icon="solar:diskette-bold"
          >
            Save Credentials
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={!roomId || !roomPassword || recipientCount === 0 || loading}
            icon="solar:letter-bold"
          >
            Send Credentials via Email ({recipientCount} Leaders)
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSendCredentials}
        title="Send Match Credentials"
        message={`You are about to dispatch Room ID (${roomId}) and Password to ${recipientCount} approved Team Leader(s) via private individual emails. Are you sure you want to proceed?`}
        confirmText="Dispatch Emails"
        loading={sending}
      />
    </GlassCard>
  );
};
