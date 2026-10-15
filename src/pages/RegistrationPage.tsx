import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  Shield,
  Search,
  ShieldAlert,
  RotateCcw,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useGame } from '../context/GameContext';
import { useTeams } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { useCreator } from '../hooks/useCreator';
import { useBranding } from '../hooks/useBranding';
import { auth } from '../lib/firebase';
import {
  deleteTeam,
  deleteRegistration,
  disqualifyTeam,
  reinstateTeam,
  updateTeam,
  logAudit,
} from '../lib/firestore';
import { PageHeader } from '../components/ui/PageHeader';
import { TiltCard } from '../components/ui/TiltCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/EmptyState';
import { DisqualifyModal } from '../components/DisqualifyModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { cn } from '../lib/cn';
import type { Team, Game } from '../types';

export interface RegistrationPageProps {
  propGame?: Game;
}

export function RegistrationPage({ propGame }: RegistrationPageProps = {}) {
  const { currentGame } = useGame();
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || currentGame || context?.game || activeTournament?.game || 'BGMI';
  const { user } = useAuth();
  const { isCreatorUnlocked } = useCreator();
  const { branding } = useBranding();

  const { data: teams } = useTeams(activeTournament?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<Team | null>(null);
  const [disqualifyTeamTarget, setDisqualifyTeamTarget] = useState<Team | null>(null);
  const [editTeamTarget, setEditTeamTarget] = useState<Team | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editCaptainName, setEditCaptainName] = useState('');
  const [editCaptainPhone, setEditCaptainPhone] = useState('');
  const [editCaptainEmail, setEditCaptainEmail] = useState('');

  // Action states
  const [reinstatingId, setReinstatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getTournamentId = () => {
    return activeTournament?.id || (game === 'Free Fire' ? 'free-fire-championship-s1' : 'bgmi-championship-s1');
  };

  const filteredTeams = teams.filter((t) =>
    t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.captainName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teamTag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Disqualify action
  const handleConfirmDisqualify = async (reason: string) => {
    const tournamentId = getTournamentId();
    if (!disqualifyTeamTarget) return;
    setIsProcessing(true);
    try {
      await disqualifyTeam(
        tournamentId,
        disqualifyTeamTarget.id,
        reason,
        user?.email || 'admin'
      );
      showNotification('success', `✅ Team "${disqualifyTeamTarget.teamName}" disqualified.`);
      setDisqualifyTeamTarget(null);
    } catch (err) {
      showNotification('error', `Failed to disqualify team: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reinstate action: removes disqualification immediately with local cache, safety timeout, and feedback
  const handleReinstate = async (team: Team) => {
    if (reinstatingId) return;

    console.log('[Reinstate] ▶ Starting for:', team.teamName);
    setReinstatingId(team.id);
    setError(null);

    const timeout = setTimeout(() => {
      setReinstatingId(null);
      setError('Reinstate timed out. Check your connection.');
    }, 8000);

    try {
      const tournamentId = getTournamentId();
      await reinstateTeam(tournamentId, team.id);

      console.log('[Reinstate] ✅ Success');
      const msg = `✅ "${team.teamName}" reinstated`;
      setSuccessMsg(msg);
      showNotification('success', msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Reinstate] ❌ Failed:', err);
      setError(`Could not reinstate team: ${msg}`);
      showNotification('error', `Could not reinstate team: ${msg}`);
    } finally {
      clearTimeout(timeout);
      setReinstatingId(null);
    }
  };

  // Open confirmation modal for squad deletion
  const handleDelete = (team: Team) => {
    setDeleteConfirmTeam(team);
  };

  // Delete team with cascade, audit log, and state feedback
  const executeDelete = async (team: Team) => {
    if (deletingId) return;

    console.log('[Delete] ▶ Starting for:', team.teamName);
    setDeletingId(team.id);
    setError(null);

    const timeout = setTimeout(() => {
      setDeletingId(null);
      setDeleteConfirmTeam(null);
      setError('Delete timed out. Check your connection.');
    }, 12000);

    try {
      if (!auth.currentUser && !user && !isCreatorUnlocked) throw new Error('Not signed in');

      const tournamentId = getTournamentId();

      console.log('[Delete] Calling deleteTeam...');
      await deleteTeam(tournamentId, team.id);
      await deleteRegistration(team.id).catch(() => {});
      console.log('[Delete] ✅ Team deleted');

      try {
        await logAudit('delete_team', 'team', team.id, {
          teamName: team.teamName,
          deletedBy: user?.email || auth.currentUser?.email || (isCreatorUnlocked ? 'creator' : 'admin'),
        });
      } catch (e) {
        console.warn('Audit failed:', e);
      }

      console.log('[Delete] ✅✅✅ SUCCESS');
      const msg = `✅ "${team.teamName}" deleted`;
      setSuccessMsg(msg);
      showNotification('success', msg);
      setDeleteConfirmTeam(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('[Delete] ❌ FAILED:', err);
      const errMsg = `Could not delete team: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      setError(errMsg);
      showNotification('error', errMsg);
      setDeleteConfirmTeam(null);
    } finally {
      clearTimeout(timeout);
      setDeletingId(null);
    }
  };

  // Edit team
  const openEditModal = (team: Team) => {
    setEditTeamTarget(team);
    setEditName(team.teamName);
    setEditTag(team.teamTag || '');
    setEditCaptainName(team.captainName || '');
    setEditCaptainPhone(team.captainPhone || '');
    setEditCaptainEmail(team.captainEmail || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editTeamTarget) return;
    if (!editName.trim()) return;

    setIsProcessing(true);
    try {
      await updateTeam(activeTournament.id, editTeamTarget.id, {
        teamName: editName.trim(),
        teamTag: editTag.trim().toUpperCase() || undefined,
        captainName: editCaptainName.trim(),
        captainPhone: editCaptainPhone.trim(),
        captainEmail: editCaptainEmail.trim().toLowerCase(),
      });
      showNotification('success', `✅ Updated details for "${editName.trim()}".`);
      setEditTeamTarget(null);
    } catch (err) {
      showNotification('error', `Failed to update team: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${game} Team Management`}
        subtitle="Manage registered squads, roster information, slot allocations, and disciplinary status."
        tag="ADMIN ROSTER"
        gradient={game === 'Free Fire' ? 'red' : 'orange'}
        icon={<Users className="w-8 h-8 text-orange-400" />}
        action={
          <div className="flex items-center gap-2">
            <Link to="/register">
              <Button size="sm" variant="primary" className="text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Squad Portal</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Level Error / Success Notices */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-start gap-2.5">
          <span className="text-base">❌</span>
          <div className="flex-1">
            <strong>Action failed:</strong> {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline text-xs text-red-300 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2.5">
          <span className="text-base">✅</span>
          <span className="flex-1 font-semibold">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="ml-2 underline text-xs text-emerald-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={cn(
            'p-3.5 rounded-xl text-xs flex items-center justify-between border animate-in fade-in',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          )}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name, tag, or captain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          <span>
            {filteredTeams.length} of {teams.length} teams
          </span>
          {teams.some((t) => t.disqualified) && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              {teams.filter((t) => t.disqualified).length} Disqualified
            </span>
          )}
        </div>
      </div>

      {/* Grid of Teams */}
      {teams.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-8 h-8 text-orange-400" />}
          title="No Registered Squads Yet"
          description="There are currently no teams registered for this tournament. Use the registration portal or approve pending squads in the queue."
          action={
            <Link to="/register">
              <Button variant="primary" size="sm">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register First Squad</span>
              </Button>
            </Link>
          }
        />
      ) : filteredTeams.length === 0 ? (
        <Card className="text-center py-16 text-gray-400 border-dashed border-white/10">
          <Shield className="w-10 h-10 mx-auto text-gray-500 mb-2 opacity-50" />
          <p className="text-sm font-medium">No registered teams found matching search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const isDQ = Boolean(team.disqualified);

            return (
              <TiltCard key={team.id} intensity={8} glow={isDQ ? '#E11D48' : '#FF6B35'}>
                <Card
                  className={cn(
                    'h-full p-5 flex flex-col justify-between transition-all border',
                    isDQ
                      ? 'border-rose-500/40 bg-rose-950/20 opacity-80 hover:opacity-100'
                      : 'border-white/10 bg-gradient-to-br from-white/[0.04] to-black/60 hover:border-orange-500/40'
                  )}
                >
                  <div>
                    {/* Top DQ Banner if Disqualified */}
                    {isDQ && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
                        <span className="font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          DISQUALIFIED
                        </span>
                        <span className="text-[10px] text-rose-400/80 font-mono">
                          {team.disqualifiedAt ? new Date(team.disqualifiedAt).toLocaleDateString() : 'Inactive'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {team.logoUrl || branding.teamPlaceholder ? (
                          <img
                            src={team.logoUrl || branding.teamPlaceholder}
                            alt={team.teamName}
                            className={cn(
                              'w-11 h-11 rounded-xl object-cover border shrink-0',
                              isDQ ? 'border-rose-500/40 grayscale' : 'border-white/20'
                            )}
                          />
                        ) : (
                          <div
                            className={cn(
                              'w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0',
                              isDQ
                                ? 'bg-rose-900/60 border border-rose-500/30'
                                : 'bg-gradient-to-tr from-orange-600 to-amber-500 shadow-md'
                            )}
                          >
                            {team.teamName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <h2
                            title={team.teamName}
                            className={cn(
                              "text-lg font-bold font-['Teko',sans-serif] text-2xl truncate leading-tight",
                              isDQ ? 'line-through text-slate-400' : 'text-white'
                            )}
                          >
                            {team.teamName}
                          </h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {team.teamTag && (
                              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                [{team.teamTag}]
                              </span>
                            )}
                            {team.isDemo && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded">
                                🧪 DEMO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete Team Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(team)}
                        disabled={deletingId === team.id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                        title="Delete Squad"
                      >
                        {deletingId === team.id ? (
                          <span className="w-4 h-4 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Disqualification Reason Banner */}
                    {isDQ && team.disqualificationReason && (
                      <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-rose-500/20 text-[11px] text-rose-300/90">
                        <strong className="text-rose-300">Infraction:</strong> {team.disqualificationReason}
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs text-gray-300 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium">Captain:</span>
                        <strong className="text-white truncate">{team.captainName || 'N/A'}</strong>
                      </div>
                      {team.captainEmail && (
                        <div className="flex items-center gap-2 text-gray-400 truncate text-[11px]">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{team.captainEmail}</span>
                        </div>
                      )}
                      {team.captainPhone && (
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{team.captainPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-gray-400">
                      Mode: {team.mode || 'BR'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isDQ ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(team)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Edit Team Details"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisqualifyTeamTarget(team)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Disqualify Squad from Tournament"
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            <span>Disqualify</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReinstate(team)}
                          disabled={reinstatingId === team.id}
                          className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 text-xs cursor-pointer shadow-md transition-all"
                        >
                          {reinstatingId === team.id ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Reinstating...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reinstate Team</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* Disqualify Modal */}
      <DisqualifyModal
        open={Boolean(disqualifyTeamTarget)}
        team={disqualifyTeamTarget}
        onClose={() => setDisqualifyTeamTarget(null)}
        onConfirm={handleConfirmDisqualify}
        isProcessing={isProcessing}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteConfirmTeam)}
        onClose={() => setDeleteConfirmTeam(null)}
        title="Confirm Squad Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300">
            Are you sure you want to delete squad{' '}
            <strong className="text-white">&ldquo;{deleteConfirmTeam?.teamName}&rdquo;</strong>? This will cascade
            delete all roster members and match records.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmTeam(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteConfirmTeam && handleDelete(deleteConfirmTeam)}
              disabled={Boolean(deletingId)}
            >
              <span>{deletingId ? 'Deleting...' : 'Delete Squad'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        open={Boolean(editTeamTarget)}
        onClose={() => setEditTeamTarget(null)}
        title={`Edit Squad: ${editTeamTarget?.teamName || ''}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-400 block">Team Name *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-400 block">Team Tag</label>
            <input
              type="text"
              maxLength={5}
              value={editTag}
              onChange={(e) => setEditTag(e.target.value.toUpperCase())}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono uppercase outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-400 block">Captain Name</label>
            <input
              type="text"
              value={editCaptainName}
              onChange={(e) => setEditCaptainName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-400 block">Captain Phone</label>
              <input
                type="text"
                value={editCaptainPhone}
                onChange={(e) => setEditCaptainPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-400 block">Captain Email</label>
              <input
                type="email"
                value={editCaptainEmail}
                onChange={(e) => setEditCaptainEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditTeamTarget(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isProcessing || !editName.trim()}>
              <span>{isProcessing ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Squad Deletion Confirmation Modal (No window.confirm, iframe safe) */}
      <ConfirmModal
        open={Boolean(deleteConfirmTeam)}
        title="Delete Squad"
        message={`Are you sure you want to permanently delete "${deleteConfirmTeam?.teamName}" and all associated player records? This action cannot be undone.`}
        confirmLabel="Delete Squad"
        cancelLabel="Keep Squad"
        variant="danger"
        isProcessing={Boolean(deletingId)}
        onConfirm={() => {
          if (deleteConfirmTeam) {
            executeDelete(deleteConfirmTeam);
          }
        }}
        onClose={() => {
          if (!deletingId) {
            setDeleteConfirmTeam(null);
          }
        }}
      />
    </div>
  );
}
