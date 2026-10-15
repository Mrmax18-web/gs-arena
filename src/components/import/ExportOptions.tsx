import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Archive, Check, AlertCircle } from 'lucide-react';
import {
  exportTournamentToJSON,
  exportTournamentToExcel,
  exportTournamentToCSVZip,
  downloadBlob,
  type ExportOptions as ExportOptionsType,
} from '../../lib/dataExport';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useAuth } from '../../context/AuthContext';
import type { Tournament } from '../../types';

export interface ExportOptionsProps {
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournament: (id: string) => void;
}

export function ExportOptions({
  tournaments,
  selectedTournamentId,
  onSelectTournament,
}: ExportOptionsProps) {
  const { user } = useAuth();

  const [options, setOptions] = useState<ExportOptionsType>({
    includeTeams: true,
    includeMembers: true,
    includeMatches: true,
    includeStandings: true,
    includeRegistrations: true,
    includePayments: true,
  });

  const [format, setFormat] = useState<'json' | 'xlsx' | 'csv_zip'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleOption = (key: keyof ExportOptionsType) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    if (!selectedTournamentId) {
      setStatusMessage({ type: 'error', text: 'Please select a tournament to export.' });
      return;
    }

    const currentTourney = tournaments.find((t) => t.id === selectedTournamentId);
    const safeName = (currentTourney?.name || 'Tournament').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];

    setIsExporting(true);
    setStatusMessage(null);

    try {
      let blob: Blob;
      let filename = '';

      if (format === 'json') {
        blob = await exportTournamentToJSON(selectedTournamentId, options, user?.email || 'admin');
        filename = `${safeName}-${dateStamp}.json`;
      } else if (format === 'xlsx') {
        blob = await exportTournamentToExcel(selectedTournamentId, options, user?.email || 'admin');
        filename = `${safeName}-${dateStamp}.xlsx`;
      } else {
        blob = await exportTournamentToCSVZip(selectedTournamentId, options, user?.email || 'admin');
        filename = `${safeName}-${dateStamp}-csv.zip`;
      }

      downloadBlob(blob, filename);
      setStatusMessage({ type: 'success', text: `Downloaded ${filename} successfully.` });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Export failed. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const tournamentOptions = tournaments.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.game} • ${t.mode || 'BR'})`,
  }));

  return (
    <Card className="p-6 space-y-5 border border-white/10">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
            Export Tournament Data
          </h3>
          <p className="text-xs text-gray-400">
            Export all squad rosters, round scores, placements, and registered members.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tournament Dropdown */}
      <div>
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
          Select Tournament
        </label>
        {tournaments.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No tournaments found in database.</p>
        ) : (
          <Select
            value={selectedTournamentId}
            onChange={onSelectTournament}
            options={tournamentOptions}
            className="text-xs"
          />
        )}
      </div>

      {/* Options Checkboxes */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
          Include Components
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includeTeams}
              onChange={() => toggleOption('includeTeams')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Teams / Squads</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includeMembers}
              onChange={() => toggleOption('includeMembers')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Roster Members</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includeMatches}
              onChange={() => toggleOption('includeMatches')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Matches & Scores</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includeStandings}
              onChange={() => toggleOption('includeStandings')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Leaderboard Standings</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includeRegistrations}
              onChange={() => toggleOption('includeRegistrations')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Registrations Queue</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 select-none">
            <input
              type="checkbox"
              checked={options.includePayments}
              onChange={() => toggleOption('includePayments')}
              className="accent-orange-500 rounded"
            />
            <span className="text-gray-200">Payments & UTRs</span>
          </label>
        </div>
      </div>

      {/* Format Selector */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
          Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFormat('json')}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              format === 'json'
                ? 'bg-orange-500/20 border-orange-500 text-white shadow-md shadow-orange-500/10'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <FileJson className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block">JSON (.json)</span>
              <span className="text-[10px] text-gray-400">Full re-importable data</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat('xlsx')}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              format === 'xlsx'
                ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block">Excel (.xlsx)</span>
              <span className="text-[10px] text-gray-400">Multi-sheet workbook</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat('csv_zip')}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              format === 'csv_zip'
                ? 'bg-blue-500/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Archive className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block">CSV (.zip)</span>
              <span className="text-[10px] text-gray-400">One CSV per table</span>
            </div>
          </button>
        </div>
      </div>

      {/* Download Action */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleDownload}
          disabled={isExporting || tournaments.length === 0}
          className="w-full text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Package...' : 'Download Export'}</span>
        </Button>
      </div>
    </Card>
  );
}
