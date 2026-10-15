import React, { useState } from 'react';
import {
  Users,
  Trophy,
  Swords,
  Layers,
  AlertTriangle,
  Upload,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { ImportProgressBar } from './ImportProgressBar';
import type { ParsedData, ImportStrategy, ImportResult } from '../../lib/dataImport';
import type { Tournament } from '../../types';

export interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: ParsedData | null;
  existingTournaments: Tournament[];
  onConfirmImport: (strategy: ImportStrategy, targetTourneyId?: string) => Promise<ImportResult>;
  isImporting?: boolean;
  importProgress?: { status: string; percent: number };
}

export function ImportPreviewModal({
  open,
  onClose,
  data,
  existingTournaments,
  onConfirmImport,
  isImporting = false,
  importProgress,
}: ImportPreviewModalProps) {
  const [strategy, setStrategy] = useState<ImportStrategy>('create_new');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    return existingTournaments[0]?.id || '';
  });
  const [replaceConfirmWord, setReplaceConfirmWord] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!data) return null;

  const teamsCount = data.teams?.length || 0;
  const membersCount = Object.values(data.members || {}).reduce(
    (sum, roster) => sum + roster.length,
    0
  );
  const matchesCount = data.matches?.length || 0;
  const registrationsCount = data.registrations?.length || 0;

  // Conflict detection
  const currentTourney = existingTournaments.find((t) => t.id === selectedTargetId);
  const isReplacing = strategy === 'replace';

  const handleStartImport = async () => {
    setErrorMsg(null);
    if (isReplacing && replaceConfirmWord.trim() !== 'DELETE') {
      setErrorMsg('Please type DELETE in capital letters to confirm replacing existing data.');
      return;
    }

    try {
      await onConfirmImport(strategy, strategy === 'create_new' ? undefined : selectedTargetId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isImporting) onClose();
      }}
      title="Tournament Import Preview & Configuration"
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Summary Card */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                {data.tournament?.name || 'Package Data'}
              </h4>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-orange-400">
              {data.tournament?.game || 'ESPORTS'} • {data.tournament?.mode || 'BR'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-orange-400" />
                Squads
              </span>
              <span className="text-lg font-black font-mono text-white mt-1">
                {teamsCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" />
                Members
              </span>
              <span className="text-lg font-black font-mono text-white mt-1">
                {membersCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Swords className="w-3 h-3 text-rose-400" />
                Matches
              </span>
              <span className="text-lg font-black font-mono text-white mt-1">
                {matchesCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Registrations
              </span>
              <span className="text-lg font-black font-mono text-white mt-1">
                {registrationsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Strategy Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
            Select Import Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStrategy('create_new')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                strategy === 'create_new'
                  ? 'bg-orange-500/20 border-orange-500 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="font-bold text-xs block">Create New</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Generates fresh tournament with mapped IDs
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStrategy('merge')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                strategy === 'merge'
                  ? 'bg-blue-500/20 border-blue-500 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="font-bold text-xs block">Merge into Existing</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Updates matches and teams by squad name
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStrategy('replace')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                strategy === 'replace'
                  ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="font-bold text-xs block text-rose-300">Replace Existing</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Overwrites target tournament completely
              </span>
            </button>
          </div>
        </div>

        {/* Target Tournament (if merge or replace) */}
        {(strategy === 'merge' || strategy === 'replace') && (
          <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Target Existing Tournament
            </label>
            <Select
              value={selectedTargetId}
              onChange={setSelectedTargetId}
              options={existingTournaments.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.game})`,
              }))}
            />
          </div>
        )}

        {/* Danger Warning if Replace Strategy */}
        {isReplacing && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>DANGER: Irreversible Data Replacement</span>
            </div>
            <p>
              This will completely <strong>DELETE</strong> all existing teams, rosters, and match
              records in <strong>"{currentTourney?.name || selectedTargetId}"</strong> before
              importing.
            </p>
            <div className="pt-1">
              <Input
                placeholder="Type DELETE to confirm"
                value={replaceConfirmWord}
                onChange={(e) => setReplaceConfirmWord(e.target.value)}
                className="bg-black/60 border-rose-500/50 text-white font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Real-time Progress Bar */}
        {isImporting && importProgress && (
          <ImportProgressBar
            status={importProgress.status}
            percent={importProgress.percent}
          />
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            variant={isReplacing ? 'danger' : 'primary'}
            size="sm"
            onClick={handleStartImport}
            disabled={isImporting || (isReplacing && replaceConfirmWord.trim() !== 'DELETE')}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Importing...' : 'Confirm & Import Data'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
