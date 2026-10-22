import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { tournamentConverter, matchConverter, teamConverter, registrationConverter } from '../lib/converters';
import { Match, Tournament, Team } from '../types/tournament';
import { Registration } from '../types/registration';
import { GlassCard } from '../components/ui/GlassCard';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { withTimeout, TimeoutError } from '../lib/timeout';
import { createTournament, updateTournament, deleteTournament, deleteMatch, preallocateTournamentId } from '../services/tournamentService';
import { MatchForm } from '../components/admin/MatchForm';
import { ResultsEditor } from '../components/admin/ResultsEditor';
import { RoomCredentialsForm } from '../components/admin/RoomCredentialsForm';
import { RegistrationReview } from '../components/admin/RegistrationReview';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { uploadFile, validateImageFile } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/permissions';
import { where, limit } from 'firebase/firestore';
import { Icon } from '@iconify/react';


export const AdminPage: React.FC = () => {
  const { user, role } = useAuth();
  const { gameId, game } = useGame();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'tournaments' | 'matches' | 'results' | 'credentials' | 'registrations'>('tournaments');

  // Load tournaments for the active game
  const tourneyConstraints = useMemo(() => [where('gameId', '==', gameId), limit(50)], [gameId]);
  const {
    data: tournaments,
    refetch: refetchTournaments,
  } = useFirestoreCollection<Tournament>('tournaments', tourneyConstraints, tournamentConverter);

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');

  const activeTournament = useMemo(() => {
    if ((tournaments || []).length === 0) return null;
    if (selectedTourneyId) {
      const f = tournaments.find((t) => t.id === selectedTourneyId);
      if (f) return f;
    }
    return tournaments[0];
  }, [tournaments, selectedTourneyId]);

  // Load matches
  const {
    data: matches,
    refetch: refetchMatches,
  } = useFirestoreCollection<Match>(
    activeTournament ? `tournaments/${activeTournament.id}/matches` : '',
    [],
    matchConverter
  );

  // Load teams
  const { data: teams } = useFirestoreCollection<Team>(
    activeTournament ? `tournaments/${activeTournament.id}/teams` : '',
    [],
    teamConverter
  );

  // Load registrations
  const regConstraints = useMemo(() => {
    return activeTournament ? [where('tournamentId', '==', activeTournament.id), limit(50)] : [];
  }, [activeTournament]);

  const {
    data: registrations,
    refetch: refetchRegistrations,
  } = useFirestoreCollection<Registration>(
    'registrations',
    regConstraints,
    registrationConverter,
    { enabled: Boolean(user && isAdmin(role)) }
  );

  // Tournament Create/Edit Modal
  const [tourneyModalOpen, setTourneyModalOpen] = useState(false);
  const [editingTourney, setEditingTourney] = useState<Tournament | null>(null);
  const [allocatedTourneyId, setAllocatedTourneyId] = useState<string | null>(null);
  const [pendingQrFile, setPendingQrFile] = useState<File | null>(null);
  const [tourneyName, setTourneyName] = useState('');
  const [tourneyStatus, setTourneyStatus] = useState<Tournament['status']>('upcoming');
  const [tourneyRegOpen, setTourneyRegOpen] = useState(true);
  const [tourneyEntryFeeINR, setTourneyEntryFeeINR] = useState('0');
  const [tourneyUpiQrUrl, setTourneyUpiQrUrl] = useState('');
  const [tourneyUpiId, setTourneyUpiId] = useState('');
  const [qrUploadProgress, setQrUploadProgress] = useState<number | null>(null);
  const [savingTourney, setSavingTourney] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Delete Confirmation States (Law 2: Figure and Ground)
  const [deleteTourneyId, setDeleteTourneyId] = useState<string | null>(null);
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parkinson's Law (Law 4): Copy from previous tournament
  const [backupTourneyData, setBackupTourneyData] = useState<{
    name: string;
    entryFeeINR: string;
    upiId: string;
    upiQrUrl: string;
    regOpen: boolean;
  } | null>(null);
  const [copiedFromPrev, setCopiedFromPrev] = useState(false);

  const previousTournament = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return null;
    return [...tournaments].sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    })[0];
  }, [tournaments]);

  const handleCopyFromPrevious = () => {
    if (!previousTournament) return;
    setBackupTourneyData({
      name: tourneyName,
      entryFeeINR: tourneyEntryFeeINR,
      upiId: tourneyUpiId,
      upiQrUrl: tourneyUpiQrUrl,
      regOpen: tourneyRegOpen,
    });
    setTourneyName(`${previousTournament.name} (Copy)`);
    setTourneyEntryFeeINR(
      previousTournament.entryFeePaise ? String(previousTournament.entryFeePaise / 100) : '0'
    );
    setTourneyUpiId(previousTournament.upiId || '');
    setTourneyUpiQrUrl(previousTournament.upiQrUrl || '');
    setTourneyRegOpen(previousTournament.registrationOpen);
    setCopiedFromPrev(true);
  };

  const handleUndoCopy = () => {
    if (!backupTourneyData) return;
    setTourneyName(backupTourneyData.name);
    setTourneyEntryFeeINR(backupTourneyData.entryFeeINR);
    setTourneyUpiId(backupTourneyData.upiId);
    setTourneyUpiQrUrl(backupTourneyData.upiQrUrl);
    setTourneyRegOpen(backupTourneyData.regOpen);
    setBackupTourneyData(null);
    setCopiedFromPrev(false);
  };

  // Match Modal
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Results Editor
  const [selectedMatchForResults, setSelectedMatchForResults] = useState<Match | null>(null);

  // Room Credentials Form
  const [selectedMatchForCreds, setSelectedMatchForCreds] = useState<Match | null>(null);

  const handleOpenTourneyModal = (t?: Tournament) => {
    setBackupTourneyData(null);
    setCopiedFromPrev(false);
    setPendingQrFile(null);
    if (t) {
      setEditingTourney(t);
      setAllocatedTourneyId(t.id);
      setTourneyName(t.name);
      setTourneyStatus(t.status);
      setTourneyRegOpen(t.registrationOpen);
      setTourneyEntryFeeINR(t.entryFeePaise ? String(t.entryFeePaise / 100) : '0');
      setTourneyUpiQrUrl(t.upiQrUrl || '');
      setTourneyUpiId(t.upiId || '');
    } else {
      setEditingTourney(null);
      try {
        setAllocatedTourneyId(preallocateTournamentId());
      } catch {
        setAllocatedTourneyId(null);
      }
      setTourneyName('');
      setTourneyStatus('upcoming');
      setTourneyRegOpen(true);
      setTourneyEntryFeeINR('0');
      setTourneyUpiQrUrl('');
      setTourneyUpiId('');
    }
    setQrUploadProgress(null);
    setTourneyModalOpen(true);
  };

  /**
   * Handles creating or updating a tournament document.
   * Write ordering:
   * 1. Save text/metadata FIRST
   * 2. Upload QR image SECOND (with interim 8s timeout, preventing late completion patching)
   * 3. Patch QR URL THIRD
   * Shows "Image upload failed; text data was saved without the image" ONLY when text succeeded and image failed.
   */
  const handleSaveTourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingTourney) return;
    if (!tourneyName.trim()) {
      error('Name Required', 'Please enter tournament name.');
      return;
    }

    const entryFeePaise = Math.max(0, Math.round((Number(tourneyEntryFeeINR) || 0) * 100));

    setSavingTourney(true);
    let textSaved = false;
    let imageUploadFailed = false;

    try {
      await withTimeout(
        (async () => {
          let targetTid = editingTourney?.id || allocatedTourneyId || undefined;

          // 1. Save text/metadata FIRST
          if (editingTourney?.id) {
            await updateTournament(editingTourney.id, {
              name: tourneyName.trim(),
              status: tourneyStatus,
              registrationOpen: tourneyRegOpen,
              entryFeePaise,
              upiQrUrl: tourneyUpiQrUrl.trim() || undefined,
              upiId: tourneyUpiId.trim() || undefined,
            });
            targetTid = editingTourney.id;
          } else {
            targetTid = await createTournament(
              tourneyName.trim(),
              gameId,
              4,
              undefined,
              {
                entryFeePaise,
                upiQrUrl: tourneyUpiQrUrl.trim() || undefined,
                upiId: tourneyUpiId.trim() || undefined,
              },
              allocatedTourneyId || undefined
            );
            if (isMountedRef.current) {
              setSelectedTourneyId(targetTid);
            }
          }
          textSaved = true;

          // 2. Upload image SECOND (if a file was selected)
          if (pendingQrFile && targetTid) {
            let uploadTimedOut = false;
            try {
              const ext = pendingQrFile.name.split('.').pop() || 'png';
              const path = `tournaments/${targetTid}/qr_${Date.now()}.${ext}`;
              if (isMountedRef.current) setQrUploadProgress(0);

              const { promise } = uploadFile(path, pendingQrFile, {
                onProgress: (pct) => {
                  if (!uploadTimedOut && isMountedRef.current) {
                    setQrUploadProgress(pct);
                  }
                },
              });

              // 2. Upload image SECOND (service enforces 8s timeout internally)
              const uploadedUrl = await promise;

              // 3. Patch the URL THIRD (guarded against late upload completion)
              if (!uploadTimedOut) {
                await updateTournament(targetTid, {
                  upiQrUrl: uploadedUrl,
                });
                if (isMountedRef.current) {
                  setTourneyUpiQrUrl(uploadedUrl);
                  setPendingQrFile(null);
                }
              }
            } catch (imgErr: unknown) {
              uploadTimedOut = true;
              imageUploadFailed = true;
              console.error('[AdminPage] QR image upload failed or timed out:', imgErr);
            } finally {
              if (isMountedRef.current) {
                setQrUploadProgress(null);
              }
            }
          }

          if (isMountedRef.current) {
            refetchTournaments();
            setTourneyModalOpen(false);

            if (textSaved && imageUploadFailed) {
              error(
                'Partial Save',
                'Image upload failed; text data was saved without the image'
              );
            } else {
              success(
                editingTourney ? 'Tournament Updated' : 'Tournament Created',
                `"${tourneyName}" ${editingTourney ? 'updated' : 'created'}.`
              );
            }
          }
        })(),
        30000,
        'handleSaveTourneyFlow'
      );
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      if (err instanceof TimeoutError || (err as { name?: string })?.name === 'TimeoutError') {
        error(
          'Save Pending',
          'Save is taking longer than expected. Its status is unknown; check the record when your connection returns before retrying.'
        );
      } else {
        const errObj = err as { code?: string; message?: string };
        const isPermissionErr =
          errObj?.code === 'permission-denied' ||
          errObj?.message?.toLowerCase().includes('permission');
        const msg = isPermissionErr
          ? 'Permission denied: Ensure you are signed in with dheerajsinghbaghel1306@gmail.com to create/edit tournaments.'
          : (errObj?.message || 'Could not save tournament.');
        error('Save Failed', msg);
      }
    } finally {
      if (isMountedRef.current) {
        setSavingTourney(false);
      }
    }
  };


  const handleDeleteTourney = (tid: string) => {
    setDeleteTourneyId(tid);
  };

  const handleConfirmDeleteTourney = async () => {
    if (!deleteTourneyId) return;
    setIsDeleting(true);
    try {
      await deleteTournament(deleteTourneyId);
      success('Tournament Deleted', 'Tournament removed.');
      refetchTournaments();
      setDeleteTourneyId(null);
    } catch (err: any) {
      error('Delete Failed', err?.message || 'Failed to delete tournament.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteMatch = (mid: string) => {
    setDeleteMatchId(mid);
  };

  const handleConfirmDeleteMatch = async () => {
    if (!activeTournament || !deleteMatchId) return;
    setIsDeleting(true);
    try {
      await deleteMatch(activeTournament.id, deleteMatchId);
      success('Match Deleted', 'Match removed from bracket.');
      refetchMatches();
      setDeleteMatchId(null);
    } catch (err: any) {
      error('Delete Failed', err?.message || 'Failed to delete match.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Validates and stages an uploaded QR image file for deferred upload during tournament save.
   */
  const handleQrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      error('Invalid Image', validation.error || 'Please choose a JPEG, PNG, or WebP under 5 MB.');
      e.target.value = '';
      return;
    }
    setPendingQrFile(file);
  };

  // Preview Standings using useLeaderboard
  const { standings } = useLeaderboard({
    tournamentId: activeTournament?.id,
    gameId,
    scoringSnapshot: activeTournament?.scoringSnapshot || {
      placementPoints: game.placementPoints,
      killPoints: game.killPoints,
      matchWinPoints: game.matchWinPoints ?? 1,
      mvpWeights: game.mvpWeights,
    },
  });

  const tabsConfig = [
    { id: 'tournaments', label: 'Tournaments', icon: 'solar:cup-bold' },
    { id: 'matches', label: 'Matches', icon: 'solar:gamepad-bold' },
    { id: 'results', label: 'Results Entry', icon: 'solar:notes-bold' },
    { id: 'credentials', label: 'Room Secrets', icon: 'solar:key-minimalistic-bold' },
    {
      id: 'registrations',
      label: 'Applications',
      icon: 'solar:users-group-rounded-bold',
      badge: (registrations || []).filter((r) => r.status === 'pending').length || undefined,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Admin & Referee Console
            </span>
            <span className="text-xs text-slate-400 font-semibold">&bull; Active: {game.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Tournament Management
          </h2>
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 0 && (
          <div className="w-full sm:w-64">
            <Select
              options={tournaments.map((t) => ({ value: t.id, label: t.name }))}
              value={activeTournament?.id || ''}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* 1. TOURNAMENTS TAB */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tournaments ({gameId})
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon="solar:add-circle-bold"
              onClick={() => handleOpenTourneyModal()}
            >
              Create Tournament
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((tourney) => (
              <GlassCard key={tourney.id} className="p-5 space-y-3 border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {tourney.name}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    tourney.status === 'live'
                      ? 'bg-rose-500/20 text-rose-500'
                      : tourney.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    {tourney.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Game: <strong>{tourney.gameId}</strong></div>
                  <div>Roster Size: <strong>{tourney.rosterSize} Players</strong></div>
                  <div>
                    Entry Fee: <strong>
                      {tourney.entryFeePaise && tourney.entryFeePaise > 0
                        ? `₹${(tourney.entryFeePaise / 100).toFixed(2)} INR`
                        : 'Free Entry'}
                    </strong>
                  </div>
                  <div>
                    Registration: <strong className={tourney.registrationOpen ? 'text-emerald-500' : 'text-slate-400'}>
                      {tourney.registrationOpen ? 'Open' : 'Closed'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTourney(tourney.id)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenTourneyModal(tourney)}
                  >
                    Edit Tournament
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* 2. MATCHES TAB */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Matches &bull; {activeTournament?.name || 'No Tournament'}
              </h3>
              <p className="text-xs text-slate-400">Schedule match times, maps, and status.</p>
            </div>
            {activeTournament && (
              <Button
                variant="primary"
                size="sm"
                icon="solar:add-circle-bold"
                onClick={() => {
                  setEditingMatch(null);
                  setMatchModalOpen(true);
                }}
              >
                Schedule Match
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {(matches || []).map((m) => (
              <GlassCard key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      Match #{m.matchNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">&bull; {m.map}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'live'
                        ? 'bg-rose-500/20 text-rose-500'
                        : m.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scheduled: {new Date(m.scheduledAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMatch(m.id)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingMatch(m);
                      setMatchModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* 3. RESULTS ENTRY TAB */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {!selectedMatchForResults ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select a Match to Record or Edit Results
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(matches || []).map((m) => (
                  <GlassCard
                    key={m.id}
                    interactive
                    onClick={() => setSelectedMatchForResults(m)}
                    className="p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Match #{m.matchNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{m.status}</span>
                    </div>
                    <p className="text-xs text-slate-400">Map: {m.map}</p>
                    <span className="text-xs font-bold text-brand-500 flex items-center gap-1">
                      Edit Results <Icon icon="solar:alt-arrow-right-bold" />
                    </span>
                  </GlassCard>
                ))}
              </div>

              {/* Standings Live Preview */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Standings Preview ({activeTournament?.name})
                </h4>
                <LeaderboardTable standings={standings} gameId={gameId} />
              </div>
            </div>
          ) : (
            <ResultsEditor
              tournamentId={activeTournament!.id}
              match={selectedMatchForResults}
              teams={teams}
              gameId={gameId}
              snapshot={activeTournament!.scoringSnapshot}
              onSuccess={() => {
                setSelectedMatchForResults(null);
                refetchMatches();
              }}
              onCancel={() => setSelectedMatchForResults(null)}
            />
          )}
        </div>
      )}

      {/* 4. CREDENTIALS TAB */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {!selectedMatchForCreds ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select Match for Private Room ID & Password Dispatch
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(matches || []).map((m) => (
                  <GlassCard
                    key={m.id}
                    interactive
                    onClick={() => setSelectedMatchForCreds(m)}
                    className="p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Match #{m.matchNumber}
                      </span>
                      <Icon icon="solar:key-minimalistic-bold" className="text-amber-500 text-lg" />
                    </div>
                    <p className="text-xs text-slate-400">Map: {m.map}</p>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      Manage Secrets <Icon icon="solar:alt-arrow-right-bold" />
                    </span>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMatchForCreds(null)}
                icon="solar:arrow-left-line-duotone"
              >
                Back to Match List
              </Button>
              <RoomCredentialsForm
                tournamentId={activeTournament!.id}
                matchId={selectedMatchForCreds.id}
                matchNumber={selectedMatchForCreds.matchNumber}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. REGISTRATIONS TAB */}
      {activeTab === 'registrations' && (
        <RegistrationReview
          registrations={registrations}
          tournamentName={activeTournament?.name}
          onReviewed={() => refetchRegistrations()}
        />
      )}

      {/* Tournament Modal */}
      <Modal
        isOpen={tourneyModalOpen}
        onClose={() => setTourneyModalOpen(false)}
        title={editingTourney ? 'Edit Tournament' : 'Create Tournament'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTourney} className="space-y-4 text-left">
          {/* Parkinson's Law (Law 4): Copy from previous tournament */}
          {!editingTourney && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-black/10">
              <Button
                type="button"
                variant="glass"
                size="sm"
                disabled={!previousTournament}
                title={
                  !previousTournament
                    ? 'No previous tournament to copy from'
                    : `Pre-fill standard values from "${previousTournament.name}"`
                }
                onClick={handleCopyFromPrevious}
                icon="solar:copy-bold"
              >
                Copy from previous tournament
              </Button>
              {copiedFromPrev && previousTournament && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-500 font-semibold flex items-center gap-1" role="status">
                    <Icon icon="solar:check-circle-bold" />
                    <span>Copied values</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleUndoCopy}
                    className="text-xs text-slate-400 hover:text-white underline font-semibold"
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
          )}

          <Input
            label="Tournament Name"
            placeholder="e.g. Pro Championship Season 1"
            value={tourneyName}
            onChange={(e) => setTourneyName(e.target.value)}
            required
          />

          <Select
            label="Status"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'live', label: 'Live' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={tourneyStatus}
            onChange={(e) => setTourneyStatus(e.target.value as any)}
          />

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={tourneyRegOpen}
              onChange={(e) => setTourneyRegOpen(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <span>Open Public Team Registrations</span>
          </label>

          {/* Entry Fee (INR) */}
          <Input
            label="Entry Fee (INR ₹)"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={tourneyEntryFeeINR}
            onChange={(e) => setTourneyEntryFeeINR(e.target.value)}
            helperText="Set to 0 for Free Entry tournaments"
          />

          {/* UPI ID */}
          <Input
            label="Official UPI ID"
            placeholder="e.g. gsarena@okhdfcbank"
            value={tourneyUpiId}
            onChange={(e) => setTourneyUpiId(e.target.value)}
            helperText="UPI ID displayed to teams during registration"
          />

          {/* UPI QR Code Image Upload / URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              UPI QR Code Image
            </label>
            {tourneyUpiQrUrl && !pendingQrFile ? (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-black/10">
                <img
                  src={tourneyUpiQrUrl}
                  alt="QR Preview"
                  className="h-12 w-12 object-contain bg-white p-1 rounded"
                />
                <span className="text-xs font-mono text-slate-300 truncate flex-1">
                  {tourneyUpiQrUrl}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setTourneyUpiQrUrl('');
                    setPendingQrFile(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : pendingQrFile ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-brand-500/30 bg-brand-500/10">
                <Icon icon="solar:file-check-bold" className="text-2xl text-brand-400 shrink-0" />
                <div className="truncate flex-1">
                  <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {pendingQrFile.name}
                  </div>
                  <div className="text-[10px] text-brand-500 dark:text-brand-300">
                    Ready to upload on save ({(pendingQrFile.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setPendingQrFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleQrFileSelect}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-slate-300 hover:file:bg-white/20 cursor-pointer"
                />
                <Input
                  placeholder="Or paste QR Image URL (https://...)"
                  value={tourneyUpiQrUrl}
                  onChange={(e) => setTourneyUpiQrUrl(e.target.value)}
                />
              </div>
            )}
            {qrUploadProgress !== null && (
              <div className="text-[10px] text-amber-500 font-medium">
                Uploading QR: {qrUploadProgress}%
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setTourneyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingTourney}
              disabled={savingTourney}
            >
              {editingTourney ? 'Update Tournament' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Match Modal */}
      <Modal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        title={editingMatch ? `Edit Match #${editingMatch.matchNumber}` : 'Create Match'}
        maxWidth="md"
      >
        {activeTournament && (
          <MatchForm
            tournamentId={activeTournament.id}
            match={editingMatch}
            onSuccess={() => {
              setMatchModalOpen(false);
              refetchMatches();
            }}
            onCancel={() => setMatchModalOpen(false)}
          />
        )}
      </Modal>

      {/* Tournament Deletion ConfirmDialog (Law 2: Figure and Ground) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTourneyId)}
        onClose={() => setDeleteTourneyId(null)}
        onConfirm={handleConfirmDeleteTourney}
        title="Confirm Tournament Deletion"
        message="Are you sure you want to permanently delete this tournament? This will purge all associated matches, bracket slots, and scoring records. This action is irreversible."
        confirmText="Delete Tournament"
        variant="danger"
        loading={isDeleting}
      />

      {/* Match Deletion ConfirmDialog (Law 2: Figure and Ground) */}
      <ConfirmDialog
        isOpen={Boolean(deleteMatchId)}
        onClose={() => setDeleteMatchId(null)}
        onConfirm={handleConfirmDeleteMatch}
        title="Confirm Match Deletion"
        message="Delete this match and all its recorded results? This will recalculate the leaderboard standings immediately."
        confirmText="Delete Match"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default AdminPage;


