import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Palette,
  Database,
  Activity,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useCreator } from '../hooks/useCreator';
import { useBackground, DEFAULT_BACKGROUND_STATE } from '../context/BackgroundContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useTournament } from '../context/TournamentContext';
import { useToast } from '../context/ToastContext';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { MorphTabs, type TabItem } from '../components/ui/MorphTabs';
import { TagChip } from '../components/ui/TagChip';
import { Button } from '../components/ui/Button';
import { exportTournamentToJSON, downloadBlob } from '../lib/dataExport';
import { cn } from '../lib/cn';

/**
 * Creator Console Page.
 * Pinned compact glass sheet allowing real-time ribbon preview behind the panel.
 * Includes four dedicated tabs: Background, Theme, Data, Diagnostics.
 */
export function CreatorPanelPage() {
  const navigate = useNavigate();
  const { isCreatorUnlocked, unlock, lock } = useCreator();
  const { state: bgState, setBackground, resetBackground } = useBackground();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const { activeTournament } = useTournament();
  const { showToast } = useToast();
  const connectionStatus = useConnectionStatus();

  const [activeTab, setActiveTab] = useState<string>('background');
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPendingData, setImportPendingData] = useState<any>(null);

  // Diagnostics: Live FPS sampler
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      frameCountRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        const measuredFps = Math.round(
          (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
        );
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Diagnostics: WebGL2 status
  const isWebGL2 = typeof document !== 'undefined' && !!document.createElement('canvas').getContext('webgl2');

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlock(passwordInput);
    if (!success) {
      setUnlockError(true);
      showToast('Invalid creator passkey', 'error');
    } else {
      setUnlockError(false);
      setPasswordInput('');
      showToast('Creator Console unlocked', 'success');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bgState, null, 2));
    setCopiedJson(true);
    showToast('Background config copied to clipboard', 'info');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportData = async () => {
    try {
      const tid = activeTournament?.id || 'default';
      const blob = await exportTournamentToJSON(tid, {
        includeTeams: true,
        includeMembers: true,
        includeMatches: true,
        includeStandings: true,
        includeRegistrations: true,
        includePayments: true,
      });
      downloadBlob(blob, `gs-arena-backup-${tid}-${new Date().toISOString().slice(0, 10)}.json`);
      showToast('Tournament backup exported successfully', 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure');
        }
        setImportPendingData(parsed);
        setImportModalOpen(true);
      } catch (err: any) {
        showToast(`Invalid JSON file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeCache = () => {
    if (confirm('Clear local app cache and reload? This will not delete Firestore data.')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        showToast('Local cache wiped', 'info');
        setTimeout(() => window.location.reload(), 500);
      } catch {
        // Ignore
      }
    }
  };

  const tabs: TabItem[] = [
    { id: 'background', label: 'Background', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  // Locked gate screen
  if (!isCreatorUnlocked) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-[20px] border border-border bg-surface/85 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-warn/10 border border-warn/30 text-warn mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TagChip variant="warn">RESTRICTED</TagChip>
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
              Creator Console
            </h1>
            <p className="font-sans text-xs text-muted mt-1">
              Enter your creator security passkey to access live visual controls and broadcast telemetry.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label htmlFor="passkey" className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                Master Security Key
              </label>
              <input
                id="passkey"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setUnlockError(false);
                }}
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-2.5 rounded-control border bg-surface-2/80 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors',
                  unlockError ? 'border-danger focus:ring-danger' : 'border-border'
                )}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" className="flex-1">
                Unlock Console
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-6rem)] py-6 flex flex-col justify-start items-end">
      {/* Pinned Glass Sheet Panel */}
      <div className="w-full max-w-xl rounded-[20px] border border-border bg-surface/80 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-warn/15 border border-warn/30 flex items-center justify-center text-warn">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
                  Creator Console
                </h1>
                <TagChip variant="accent">LIVE</TagChip>
              </div>
              <p className="font-mono text-[10px] text-muted">
                REAL-TIME TELEMETRY & SHADER DIRECTIVE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={lock}
            className="px-2.5 py-1 rounded-[6px] border border-border bg-surface-2/60 text-muted hover:text-danger hover:border-danger/40 font-mono text-[11px] uppercase tracking-wider transition-colors"
          >
            Lock
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <MorphTabs
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            variant="underline"
            density="default"
            aria-label="Creator Console Navigation"
          />
        </div>

        {/* Tab Content Panels */}
        <div className="mt-5 space-y-4">
          {/* ━━━ TAB 1: BACKGROUND ━━━ */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              {/* Sliders */}
              <div className="space-y-3.5 bg-surface-2/40 p-4 rounded-xl border border-border/50">
                {/* Density */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="text-muted uppercase tracking-wider">Density</span>
                    <span className="text-accent font-bold tabular-nums">{bgState.density}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bgState.density}
                    onChange={(e) => setBackground({ density: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="text-muted uppercase tracking-wider">Height</span>
                    <span className="text-accent font-bold tabular-nums">{bgState.height}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bgState.height}
                    onChange={(e) => setBackground({ height: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                {/* Speed */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="text-muted uppercase tracking-wider">Speed</span>
                    <span className="text-accent font-bold tabular-nums">{bgState.speed}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bgState.speed}
                    onChange={(e) => setBackground({ speed: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                {/* Angle */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="text-muted uppercase tracking-wider">Angle</span>
                    <span className="text-accent font-bold tabular-nums">{bgState.angle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={bgState.angle}
                    onChange={(e) => setBackground({ angle: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Color 1: Base */}
                <div className="p-3 rounded-xl border border-border/50 bg-surface-2/40 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-muted tracking-wider block">
                    Base Color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgState.color1}
                      onChange={(e) => setBackground({ color1: e.target.value })}
                      className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgState.color1}
                      onChange={(e) => setBackground({ color1: e.target.value })}
                      className="w-full font-mono text-xs px-2 py-1 rounded bg-surface border border-border uppercase"
                    />
                  </div>
                </div>

                {/* Color 2: Accent */}
                <div className="p-3 rounded-xl border border-border/50 bg-surface-2/40 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-muted tracking-wider block">
                    Accent Color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgState.color2}
                      onChange={(e) => setBackground({ color2: e.target.value })}
                      className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgState.color2}
                      onChange={(e) => setBackground({ color2: e.target.value })}
                      className="w-full font-mono text-xs px-2 py-1 rounded bg-surface border border-border uppercase"
                    />
                  </div>
                </div>

                {/* Color 3: Gold Highlight */}
                <div className="p-3 rounded-xl border border-border/50 bg-surface-2/40 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-muted tracking-wider block">
                    Gold Trim
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgState.color3}
                      onChange={(e) => setBackground({ color3: e.target.value })}
                      className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgState.color3}
                      onChange={(e) => setBackground({ color3: e.target.value })}
                      className="w-full font-mono text-xs px-2 py-1 rounded bg-surface border border-border uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetBackground}
                  className="flex items-center gap-1.5 font-mono text-xs uppercase"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Defaults
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 font-mono text-xs uppercase"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy JSON
                </Button>
              </div>
            </div>
          )}

          {/* ━━━ TAB 2: THEME ━━━ */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/50 bg-surface-2/40 space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-muted block">
                  Broadcast Theme Mode
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setThemeMode(t)}
                      className={cn(
                        'py-2 px-3 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all',
                        themeMode === t
                          ? 'border-accent bg-accent/15 text-accent font-bold shadow-[0_0_12px_var(--accent-glow)]'
                          : 'border-border/60 bg-surface/50 text-muted hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="font-sans text-xs text-muted pt-1">
                  Synced across authenticated browser instances in real-time via Firestore.
                </p>
              </div>
            </div>
          )}

          {/* ━━━ TAB 3: DATA ━━━ */}
          {activeTab === 'data' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-xl border border-border/50 bg-surface-2/40 flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase text-foreground">Export Tournament JSON</h3>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    Download full tournament teams, rosters, matches, and standings.
                  </p>
                </div>
                <Button type="button" variant="primary" size="sm" onClick={handleExportData}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-surface-2/40 flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase text-foreground">Import Tournament Backup</h3>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    Upload validated schema JSON to restore tournament data.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono font-semibold uppercase hover:border-accent transition-colors">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Import
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-surface-2/40 flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase text-danger">Wipe Local Client Cache</h3>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    Clear local storage and cached preferences.
                  </p>
                </div>
                <Button type="button" variant="danger" size="sm" onClick={handleWipeCache}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Wipe
                </Button>
              </div>
            </div>
          )}

          {/* ━━━ TAB 4: DIAGNOSTICS ━━━ */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                {/* WebGL2 Status */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-surface-2/40 space-y-1">
                  <span className="text-[10px] uppercase text-muted tracking-wider">WebGL2 Context</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isWebGL2 ? 'bg-success shadow-[0_0_8px_#22c55e]' : 'bg-danger'
                      )}
                    />
                    <span className="font-bold uppercase text-foreground">
                      {isWebGL2 ? 'Hardware Accelerated' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Frame Rate */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-surface-2/40 space-y-1">
                  <span className="text-[10px] uppercase text-muted tracking-wider">Live Frame Rate</span>
                  <div className="flex items-center gap-2">
                    <Radio className="w-3 h-3 text-accent animate-pulse" />
                    <span className="font-bold tabular-nums text-foreground">{fps} FPS</span>
                  </div>
                </div>

                {/* Firestore Sync */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-surface-2/40 space-y-1">
                  <span className="text-[10px] uppercase text-muted tracking-wider">Firestore Link</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        connectionStatus === 'online' ? 'bg-success' : 'bg-warn'
                      )}
                    />
                    <span className="font-bold uppercase text-foreground">{connectionStatus}</span>
                  </div>
                </div>

                {/* Build Version */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-surface-2/40 space-y-1">
                  <span className="text-[10px] uppercase text-muted tracking-wider">Circuit Build</span>
                  <div className="font-bold text-foreground">v1.0.0-NOIR</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/40 bg-surface-2/20 text-[11px] text-muted flex items-center justify-between">
                <span>Last Telemetry Sync:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
