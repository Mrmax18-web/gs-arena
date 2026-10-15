import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Team } from '../types';

export interface DisqualifyModalProps {
  open: boolean;
  team: Team | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export function DisqualifyModal({
  open,
  team,
  onClose,
  onConfirm,
  isProcessing = false,
}: DisqualifyModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for disqualification.');
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disqualification failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isProcessing) {
          setError(null);
          setReason('');
          onClose();
        }
      }}
      title={`Disqualify Squad: ${team?.teamName || ''}`}
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-200">
              Disqualifying &ldquo;{team?.teamName}&rdquo; will:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 text-[11px]">
              <li>Mark the team as disqualified across all views</li>
              <li>Exclude them from active championship leaderboards</li>
              <li>Forfeit scheduled future fixtures</li>
              <li>Record the infraction reason in the permanent tournament ledger</li>
            </ul>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 block">
            Reason for Disqualification <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="e.g. Failure to report for scheduled fixture / Unauthorized ringer used..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 outline-none focus:border-rose-500 focus:bg-white/[0.08]"
          />
          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setError(null);
              setReason('');
              onClose();
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={isProcessing || !reason.trim()}
            className="flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Disqualifying...' : 'Confirm Disqualification'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
