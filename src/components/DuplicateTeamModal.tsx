import React, { useState } from 'react';
import { AlertTriangle, Edit3, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface DuplicateTeamModalProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  registrationId: string;
  onRename: (renamedTeamName: string) => void;
  onReplace: () => void;
}

export function DuplicateTeamModal({
  open,
  onClose,
  teamName,
  registrationId,
  onRename,
  onReplace,
}: DuplicateTeamModalProps) {
  const defaultSuffix = `#${registrationId.slice(-4).toUpperCase() || 'ALT'}`;
  const suggestedName = `${teamName} (${defaultSuffix})`;
  const [customName, setCustomName] = useState(suggestedName);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Duplicate Squad Name Detected"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            A squad named <strong className="text-white">"{teamName}"</strong> already exists in this tournament bracket.
            Choose how you would like to proceed with this registration approval.
          </div>
        </div>

        {/* Option 1: Rename New Squad */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Edit3 className="w-4 h-4 text-orange-400" />
            <span>Option 1: Approve with Disambiguated Name</span>
          </div>
          <p className="text-xs text-slate-400">
            Creates a new distinct team record under a modified squad name so both teams can compete without conflicts.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter new team name"
              className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!customName.trim()}
              onClick={() => onRename(customName.trim())}
              className="whitespace-nowrap"
            >
              Approve as "{customName.slice(0, 14)}..."
            </Button>
          </div>
        </div>

        {/* Option 2: Replace / Merge with Existing Squad */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Option 2: Replace / Merge Existing Squad</span>
          </div>
          <p className="text-xs text-slate-400">
            Reuses the existing squad record, synchronizes roster members from this registration, and transitions this entry to approved.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onReplace}
            className="w-full justify-center border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 mt-1"
          >
            Update Existing Squad Record
          </Button>
        </div>

        {/* Option 3: Cancel */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel Approval
          </Button>
        </div>
      </div>
    </Modal>
  );
}
