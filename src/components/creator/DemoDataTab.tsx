import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import {
  callGenerateDemoData,
  callDeleteAllData,
  DeleteDataResponse,
} from '../../services/functionsClient';
import { Icon } from '@iconify/react';

export const DemoDataTab: React.FC<{ onDataChanged?: () => void }> = ({ onDataChanged }) => {
  const { success, error } = useToast();

  const [generating, setGenerating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'demo' | 'all'>('demo');
  const [deleting, setDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<DeleteDataResponse | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await callGenerateDemoData();
      if (res.success) {
        success('Demo Data Generated', res.message || '16 teams and 5 matches created with player statistics.');
        if (onDataChanged) onDataChanged();
      } else {
        error('Generation Error', res.message || 'Could not generate demo data.');
      }
    } catch (err: any) {
      error('Function Error', err?.message || 'Failed to call generateDemoData.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const isDemoOnly = deleteMode === 'demo';
      const confirmPhrase = isDemoOnly ? 'DELETE DEMO' : 'DELETE ALL DATA';
      const res = await callDeleteAllData(confirmPhrase, isDemoOnly);

      if (res.success) {
        setLastResult(res);
        success(
          'Data Cleanup Complete',
          res.message || 'Selected records were wiped successfully.'
        );
        if (onDataChanged) onDataChanged();
      } else {
        error('Deletion Failed', res.message || 'Could not delete records.');
      }
    } catch (err: any) {
      error('Delete Error', err?.message || 'Failed to execute deletion callable.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Generate Demo Data Box */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:database-bold" className="text-xl text-brand-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Demo Tournament Data
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Creates a tournament with 16 competitive squads, 5 completed matches with full player stats (kills, damage, assists, revives), and calculates dynamic MVP awards. Tagged <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[10px]">isDemo: true</code>. Safe to re-run.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={generating}
            onClick={handleGenerate}
            icon="solar:magic-stick-3-bold"
            className="shrink-0"
          >
            Generate Demo Data
          </Button>
        </div>
      </GlassCard>

      {/* 2. Wipe / Reset Data Box */}
      <GlassCard strong className="p-6 border-rose-500/20 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:trash-bin-trash-bold" className="text-xl text-rose-500" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Data Cleanup & Wipe Controls
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose between purging only demo-tagged records (recommended) or performing a complete tournament wipe. User accounts, system configuration, and admin applications are strictly preserved.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => setDeleteMode('demo')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              deleteMode === 'demo'
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-slate-200 dark:border-white/10 hover:border-brand-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Delete Demo Data Only (Default)
              </span>
              <input
                type="radio"
                checked={deleteMode === 'demo'}
                onChange={() => setDeleteMode('demo')}
                className="text-brand-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Wipes only tournaments, matches, and teams tagged with <code className="font-mono">isDemo: true</code>. Real registrations and tournaments are untouched.
            </p>
          </div>

          <div
            onClick={() => setDeleteMode('all')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              deleteMode === 'all'
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-slate-200 dark:border-white/10 hover:border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                Delete All Tournament Data
              </span>
              <input
                type="radio"
                checked={deleteMode === 'all'}
                onChange={() => setDeleteMode('all')}
                className="text-rose-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Wipes ALL tournaments, matches, teams, registrations, match secrets, and contact inquiries. Requires typing confirmation phrase.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="danger"
            size="md"
            onClick={() => setDeleteModalOpen(true)}
            icon="solar:trash-bin-trash-bold"
          >
            {deleteMode === 'demo' ? 'Purge Demo Data' : 'Execute Full Wipe'}
          </Button>
        </div>

        {/* Summary of last deletion */}
        {lastResult && (
          <div className="mt-4 p-4 rounded-xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs space-y-1">
            <span className="font-semibold text-emerald-500 flex items-center gap-1">
              <Icon icon="solar:check-circle-bold" /> Summary of Last Wipe:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-600 dark:text-slate-300">
              <div>Tournaments: <strong>{lastResult.deletedCounts?.tournaments ?? 0}</strong></div>
              <div>Matches: <strong>{lastResult.deletedCounts?.matches ?? 0}</strong></div>
              <div>Registrations: <strong>{lastResult.deletedCounts?.registrations ?? 0}</strong></div>
              <div>Secrets: <strong>{lastResult.deletedCounts?.matchSecrets ?? 0}</strong></div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteMode === 'demo' ? 'Confirm Demo Data Purge' : 'Irreversible Full Data Wipe'}
        message={
          deleteMode === 'demo'
            ? 'This will delete all demo tournaments, demo matches, and generated demo teams.'
            : 'Warning: This will delete ALL tournament brackets, matches, results, match secrets, and pending team registrations.'
        }
        details={{
          wiped:
            deleteMode === 'demo'
              ? ['Tournaments (isDemo: true)', 'Demo Matches & Player Stats', 'Demo Teams']
              : ['All Tournaments & Matches', 'All Team Registrations', 'All Match Secrets & Room Passwords', 'Contact Messages'],
          preserved: ['User Accounts & Custom Claims', 'Creator & Admin Permissions', 'System & Background Configurations', 'Admin Requests'],
        }}
        confirmText={deleteMode === 'demo' ? 'Purge Demo Records' : 'Wipe All Tournament Records'}
        variant="danger"
        requiredPhrase={deleteMode === 'all' ? 'DELETE ALL DATA' : undefined}
        loading={deleting}
      />
    </div>
  );
};
