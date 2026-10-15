import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useTournaments } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ExportOptions } from '../components/import/ExportOptions';
import { ImportDropZone } from '../components/import/ImportDropZone';
import { ImportPreviewModal } from '../components/import/ImportPreviewModal';
import { ImportProgressBar } from '../components/import/ImportProgressBar';
import { exportAllData, downloadBlob } from '../lib/dataExport';
import {
  parseJSONFile,
  parseExcelFile,
  parseCSVZip,
  parseRawCSVText,
  validateImportData,
  importTournament,
  importAllData,
  downloadCSVTemplate,
  type ParsedData,
  type ImportStrategy,
} from '../lib/dataImport';

export function AdminDataPage() {
  const { game } = useOutletContext<LayoutContextType>();
  const { activeTournament, setActiveTournament } = useTournament();
  const { data: allTournaments } = useTournaments();
  const { user } = useAuth();

  // Selected tournament for export
  const [selectedExportTourneyId, setSelectedExportTourneyId] = useState<string>(() => {
    return activeTournament?.id || '';
  });

  // Full backup states
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportAllStatus, setExportAllStatus] = useState<string | null>(null);

  // Tournament Import states
  const [parsedImportData, setParsedImportData] = useState<ParsedData | null>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);

  // CSV Template Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Full Backup Restore states
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [parsedBackupData, setParsedBackupData] = useState<ParsedData | null>(null);
  const [restoreConfirmWord, setRestoreConfirmWord] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });
  const [restoreNotice, setRestoreNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup Reminder states
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('ttp_last_backup_date');
  });
  const [dismissBackupReminder, setDismissBackupReminder] = useState(false);

  const daysSinceBackup = useMemo(() => {
    if (!lastBackupDate) return null;
    const diffMs = Date.now() - new Date(lastBackupDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [lastBackupDate]);

  const showBackupReminder = !dismissBackupReminder && (daysSinceBackup === null || daysSinceBackup >= 7);

  // Handlers
  const handleFullBackupExport = async () => {
    setIsExportingAll(true);
    setExportAllStatus(null);
    try {
      const nowIso = new Date().toISOString();
      const dateStamp = nowIso.split('T')[0];
      const blob = await exportAllData(user?.email || 'admin');
      downloadBlob(blob, `TournamentTracker-FullBackup-${dateStamp}.json`);
      localStorage.setItem('ttp_last_backup_date', nowIso);
      setLastBackupDate(nowIso);
      setDismissBackupReminder(true);
      setExportAllStatus(`Full database backup downloaded successfully.`);
    } catch (err: unknown) {
      setExportAllStatus(err instanceof Error ? err.message : 'Full backup failed.');
    } finally {
      setIsExportingAll(false);
    }
  };

  // Inspect uploaded file (for Card 3)
  const handleSelectImportFile = async (file: File) => {
    setSelectedImportFile(file);
    setIsParsingImport(true);
    setImportFileError(null);
    setImportSuccessNotice(null);

    try {
      let data: ParsedData;
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.json')) {
        data = await parseJSONFile(file);
      } else if (lowerName.endsWith('.xlsx')) {
        data = await parseExcelFile(file);
      } else if (lowerName.endsWith('.zip')) {
        data = await parseCSVZip(file);
      } else if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        data = await parseRawCSVText(text);
      } else {
        throw new Error('Unsupported file extension. Please select a .json, .xlsx, .csv, or .zip file.');
      }

      const validation = validateImportData(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(' '));
      }

      setParsedImportData(data);

      // If full backup file was dropped here, redirect to restore modal
      if (data.isFullBackup) {
        setParsedBackupData(data);
        setRestoreModalOpen(true);
      } else {
        setPreviewModalOpen(true);
      }
    } catch (err: unknown) {
      setImportFileError(err instanceof Error ? err.message : 'Failed to parse file.');
      setParsedImportData(null);
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleConfirmImport = async (strategy: ImportStrategy, targetTourneyId?: string) => {
    if (!parsedImportData) throw new Error('No parsed data');
    setIsImporting(true);

    try {
      const res = await importTournament(
        parsedImportData,
        strategy,
        targetTourneyId,
        (status, percent) => {
          setImportProgress({ status, percent });
        }
      );

      setImportSuccessNotice(`✅ ${res.message}`);
      setPreviewModalOpen(false);
      setSelectedImportFile(null);
      setParsedImportData(null);

      if (res.tournamentId) {
        setActiveTournament(null); // Triggers re-sync
      }
      return res;
    } finally {
      setIsImporting(false);
    }
  };

  // CSV Template download
  const handleDownloadCsvTemplate = () => {
    const blob = downloadCSVTemplate();
    downloadBlob(blob, 'tournament_squad_roster_template.csv');
  };

  // CSV Template upload
  const handleCsvTemplateUpload = async (file: File) => {
    setCsvFile(file);
    setIsParsingCsv(true);
    setCsvError(null);
    try {
      const text = await file.text();
      const data = await parseRawCSVText(text);
      const validation = validateImportData(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(' '));
      }
      setParsedImportData(data);
      setPreviewModalOpen(true);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Invalid CSV template format.');
    } finally {
      setIsParsingCsv(false);
    }
  };

  // Backup restore file upload
  const handleBackupFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreNotice(null);
    try {
      const data = await parseJSONFile(file);
      if (!data.isFullBackup && (!data.tournaments || data.tournaments.length === 0)) {
        throw new Error('This file does not appear to be a full database backup.');
      }
      setParsedBackupData(data);
      setRestoreModalOpen(true);
    } catch (err: unknown) {
      setRestoreNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid backup JSON file.',
      });
    }
  };

  const handleConfirmFullRestore = async () => {
    if (!parsedBackupData) return;
    if (restoreConfirmWord.trim() !== 'RESTORE') {
      setRestoreNotice({ type: 'error', text: 'Please type RESTORE to confirm data restoration.' });
      return;
    }

    setIsRestoring(true);
    setRestoreNotice(null);
    try {
      const result = await importAllData(parsedBackupData, (status, percent) => {
        setRestoreProgress({ status, percent });
      });

      setRestoreNotice({
        type: 'success',
        text: `✅ ${result.message}`,
      });
      setRestoreModalOpen(false);
      setRestoreConfirmWord('');
      setParsedBackupData(null);
    } catch (err: unknown) {
      setRestoreNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Database restoration failed.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Admin Data Import & Export System"
        subtitle="Back up, migrate, import tournament scorecards, or restore complete database snapshots."
        tag="ADMIN OPERATIONS"
        gradient="orange"
        icon={<Database className="w-8 h-8 text-amber-400" />}
      />

      {/* Backup Reminder Banner */}
      {showBackupReminder && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Database Backup Recommended</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {daysSinceBackup === null
                  ? 'No database backup has been recorded yet. Export a full backup to keep your teams, standings, and settings safe.'
                  : `Your last full backup was ${daysSinceBackup} day(s) ago. We recommend downloading an offline backup at least weekly.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleFullBackupExport}
              disabled={isExportingAll}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {isExportingAll ? 'Backing Up...' : 'Backup Now'}
            </Button>
            <button
              type="button"
              onClick={() => setDismissBackupReminder(true)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Global Success / Notice Banners */}
      {importSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{importSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportSuccessNotice(null)}
            className="text-xs text-emerald-400 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {restoreNotice && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            restoreNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {restoreNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{restoreNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoreNotice(null)}
            className="text-xs hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Grid: Left (Export) & Right (Import) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================
            LEFT COLUMN: EXPORT SYSTEM
            ======================================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest font-mono">
              Export Workflows
            </h2>
          </div>

          {/* Card 1: Export Tournament */}
          <ExportOptions
            tournaments={allTournaments}
            selectedTournamentId={selectedExportTourneyId || allTournaments[0]?.id || ''}
            onSelectTournament={setSelectedExportTourneyId}
          />

          {/* Card 2: Export All Data (Full Backup) */}
          <Card className="p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
                  Export All Data (Full Database Backup)
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Generates a single comprehensive JSON package containing every tournament in Firestore,
              all squad rosters, player UIDs, match histories, registrations queue, payments, and
              creator configurations.
            </p>

            {exportAllStatus && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{exportAllStatus}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleFullBackupExport}
                disabled={isExportingAll}
                className="w-full text-xs font-bold text-amber-300 hover:text-white"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingAll ? 'Compiling Full Backup...' : 'Download Full Backup (.json)'}</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* ========================================================
            RIGHT COLUMN: IMPORT SYSTEM
            ======================================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest font-mono">
              Import & Restore
            </h2>
          </div>

          {/* Card 3: Import Tournament */}
          <Card className="p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
                  Import Tournament Package
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Upload an exported tournament (.json, .xlsx, or .zip). The system inspects squads,
              rosters, and matches, maps identifiers, and lets you create new, merge, or replace.
            </p>

            <ImportDropZone
              onFileLoaded={handleSelectImportFile}
              selectedFile={selectedImportFile}
              isParsing={isParsingImport}
              error={importFileError}
              onClear={() => {
                setSelectedImportFile(null);
                setParsedImportData(null);
                setImportFileError(null);
              }}
            />
          </Card>

          {/* Card 4: Import from CSV */}
          <Card className="p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
                  Import Squads via CSV Template
                </h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadCsvTemplate}
                className="text-[11px] py-1 px-2.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Template</span>
              </Button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Bulk-upload squad rosters directly from Google Sheets or Excel spreadsheets. Download our
              standard template, fill in your squads & UIDs, and upload below.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-xs font-mono text-slate-300 uppercase font-bold block">
                Required CSV Column Structure:
              </span>
              <div className="text-xs font-mono text-amber-300/80 bg-white/5 p-2 rounded-lg overflow-x-auto whitespace-nowrap">
                Team Name, Team Tag, Captain Name, Captain Phone, Captain Email, Mode, Player 1 Name,
                Player 1 UID, Player 2 Name, Player 2 UID...
              </div>
            </div>

            {csvError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{csvError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all text-center flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>{isParsingCsv ? 'Parsing CSV...' : 'Upload Populated CSV'}</span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvTemplateUpload(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </Card>

          {/* Card 5: Restore from Backup */}
          <Card className="p-6 space-y-4 border border-rose-500/30 bg-rose-500/[0.02]">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20 text-rose-400">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
                  Restore from Full Backup
                </h3>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                DISASTER RECOVERY
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Upload a previous full database backup JSON file to restore all tournaments, rosters, and
              configurations.
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20 text-xs text-gray-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Notice: Complete Database Restoration</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Restoring a full snapshot recreates tournaments and overwrites current matching records.
                Requires typing RESTORE to confirm.
              </p>
            </div>

            <div>
              <label className="block cursor-pointer">
                <div className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-200 transition-all text-center flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Select Full Backup JSON to Restore</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL: Import Preview Modal (Single Tournament / CSV) */}
      <ImportPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        data={parsedImportData}
        existingTournaments={allTournaments}
        onConfirmImport={handleConfirmImport}
        isImporting={isImporting}
        importProgress={importProgress}
      />

      {/* MODAL: Restore Full Backup Confirmation Modal */}
      <Modal
        open={restoreModalOpen}
        onClose={() => {
          if (!isRestoring) setRestoreModalOpen(false);
        }}
        title="Confirm Full Database Restore"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Full System Snapshot Restoration</span>
            </div>
            <p>
              This package contains{' '}
              <strong>{parsedBackupData?.tournaments?.length || 0} tournament(s)</strong>,{' '}
              <strong>{parsedBackupData?.registrations?.length || 0} registration(s)</strong>, and{' '}
              <strong>{parsedBackupData?.payments?.length || 0} payment(s)</strong>.
            </p>
            <p className="text-gray-400 text-[11px]">
              Exported on:{' '}
              {parsedBackupData?.tournaments?.[0]?.exportedAt
                ? new Date(parsedBackupData.tournaments[0].exportedAt).toLocaleString()
                : 'Recent'}
            </p>
          </div>

          <p className="text-xs text-gray-300">
            To proceed, type <strong>RESTORE</strong> in capital letters below:
          </p>

          <Input
            placeholder="Type RESTORE to confirm"
            value={restoreConfirmWord}
            onChange={(e) => setRestoreConfirmWord(e.target.value)}
            className="bg-black/60 border-rose-500/50 text-white font-mono text-xs"
            autoFocus
          />

          {isRestoring && (
            <ImportProgressBar
              status={restoreProgress.status}
              percent={restoreProgress.percent}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRestoreModalOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmFullRestore}
              disabled={isRestoring || restoreConfirmWord.trim() !== 'RESTORE'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Restoring System...' : 'Execute Restore'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminDataPage;
