import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Gamepad2,
  Flame,
  Swords,
  Shield,
  MessageSquare,
  Eye,
  IndianRupee,
  FileText,
  X,
  Phone,
  Mail,
  Trash2,
  AlertTriangle,
  Filter,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useRegistrations } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { useCreator } from '../hooks/useCreator';
import { useGame } from '../context/GameContext';
import {
  createTeam,
  createMember,
  getTeams,
  getMembers,
  updateRegistration,
  deleteRegistration,
  deleteTeam,
  logAudit,
} from '../lib/firestore';
import {
  sendRegistrationApproved,
  sendRegistrationRejected,
} from '../lib/email';
import { TagChip } from '../components/ui/TagChip';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/EmptyState';
import { DuplicateTeamModal } from '../components/DuplicateTeamModal';
import { cn } from '../lib/cn';
import type { Registration, Game } from '../types';

type QueueStatusFilter = 'pending' | 'approved' | 'rejected' | 'all';
type QueueSubTab = 'BGMI_BR' | 'FF_BR' | 'FF_CS';

/**
 * Broadcast-grade squad verification and approval queue.
 * Provides roster auditing, UTR verification, batch actions, and Firestore provisioning.
 */
export function ApprovalQueuePage() {
  const { user, isAdmin } = useAuth();
  const { isCreatorUnlocked } = useCreator();
  const { currentGame, currentMode } = useGame();
  const [subTab, setSubTab] = useState<QueueSubTab>(() => {
    if (currentGame === 'Free Fire') {
      return currentMode === 'CS' ? 'FF_CS' : 'FF_BR';
    }
    return 'BGMI_BR';
  });
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('pending');

  const activeTabLabel =
    subTab === 'BGMI_BR'
      ? 'BGMI BR'
      : subTab === 'FF_BR'
      ? 'Free Fire BR'
      : 'Free Fire Clash Squad';

  useEffect(() => {
    if (currentGame === 'Free Fire') {
      setSubTab(currentMode === 'CS' ? 'FF_CS' : 'FF_BR');
    } else {
      setSubTab('BGMI_BR');
    }
  }, [currentGame, currentMode]);

  // Real-time registrations from Firestore
  const { data: allRegistrations, loading } = useRegistrations();

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [registrationToReject, setRegistrationToReject] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null);

  // Batch delete modal state
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);

  // Screenshot viewer modal
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState<string>('');
  const [activeScreenshotTeam, setActiveScreenshotTeam] = useState<string>('');
  const [activeScreenshotUtr, setActiveScreenshotUtr] = useState<string>('');

  // Note modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [registrationForNote, setRegistrationForNote] = useState<Registration | null>(null);
  const [noteText, setNoteText] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [cardSuccess, setCardSuccess] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter registrations by game AND mode sub-tab
  const gameRegistrations = useMemo(() => {
    return allRegistrations.filter((r) => {
      if (subTab === 'BGMI_BR') return r.game === 'BGMI';
      if (subTab === 'FF_BR') return r.game === 'Free Fire' && (!r.mode || r.mode === 'BR');
      if (subTab === 'FF_CS') return r.game === 'Free Fire' && r.mode === 'CS';
      return true;
    });
  }, [allRegistrations, subTab]);

  // Pending counts per sub-tab for top badges
  const bgmiBrPending = useMemo(
    () => allRegistrations.filter((r) => r.game === 'BGMI' && r.status === 'pending').length,
    [allRegistrations]
  );
  const ffBrPending = useMemo(
    () => allRegistrations.filter((r) => r.game === 'Free Fire' && (!r.mode || r.mode === 'BR') && r.status === 'pending').length,
    [allRegistrations]
  );
  const ffCsPending = useMemo(
    () => allRegistrations.filter((r) => r.game === 'Free Fire' && r.mode === 'CS' && r.status === 'pending').length,
    [allRegistrations]
  );

  // Status counts for badges
  const pendingCount = useMemo(
    () => gameRegistrations.filter((r) => r.status === 'pending').length,
    [gameRegistrations]
  );
  const approvedCount = useMemo(
    () => gameRegistrations.filter((r) => r.status === 'approved').length,
    [gameRegistrations]
  );
  const rejectedCount = useMemo(
    () => gameRegistrations.filter((r) => r.status === 'rejected').length,
    [gameRegistrations]
  );

  // Active list filtered by status
  const currentList = useMemo(() => {
    if (statusFilter === 'all') return gameRegistrations;
    return gameRegistrations.filter((r) => r.status === statusFilter);
  }, [gameRegistrations, statusFilter]);

  // Timeout ref for robust safety management
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Duplicate squad modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateRegTarget, setDuplicateRegTarget] = useState<Registration | null>(null);
  const [duplicateExistingTeam, setDuplicateExistingTeam] = useState<{ id: string; name: string } | null>(null);

  function clearApproveTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => clearApproveTimeout();
  }, []);

  // Bulletproof approval action with 60s safety timeout, duplicate recovery, and robust state cleanup
  const handleApprove = async (
    reg: Registration,
    options?: { overrideName?: string; reuseExistingTeamId?: string }
  ) => {
    // Guard against double-click
    if (approvingId) return;

    console.log('[Approve] ▶ Starting for:', reg.teamName, reg.id, options);

    // Reset state
    setError(null);
    setSuccessMsg(null);
    setApprovingId(reg.id);
    setCardErrors((prev) => {
      const next = { ...prev };
      delete next[reg.id];
      return next;
    });
    setCardSuccess((prev) => {
      const next = { ...prev };
      delete next[reg.id];
      return next;
    });

    // Clear any existing timeout before setting a new one
    clearApproveTimeout();

    // SAFETY TIMEOUT — 60 seconds for large rosters & slow networks
    timeoutRef.current = setTimeout(() => {
      console.warn('[Approve] ⏰ TIMEOUT after 60s — unlocking button');
      setApprovingId(null);
      const timeoutError =
        'Firestore is not responding. Please check:\n' +
        '1. Ad blocker disabled for this site\n' +
        '2. Internet connection is stable\n' +
        '3. Firestore rules allow admin writes\n\n' +
        'Then click Retry.';
      setError(timeoutError);
      setCardErrors((prev) => ({ ...prev, [reg.id]: timeoutError }));
    }, 60000);

    try {
      // ─── STEP 1: Validate ──────────────────────────────────────────
      console.log('[Approve] Step 1: Validating');

      const tournamentId =
        reg.tournamentId ||
        (reg.game === 'Free Fire' ? 'free-fire-championship-s1' : 'bgmi-championship-s1');

      if (!tournamentId) {
        throw new Error('Registration has no tournamentId — cannot approve');
      }
      if (!reg.teamName?.trim()) {
        throw new Error('Registration has no team name');
      }
      if (!reg.captainEmail?.trim()) {
        throw new Error('Registration has no captain email');
      }

      console.log('[Approve] Step 1 passed');

      // ─── STEP 2: Check for existing squad or duplicates ─────────────
      console.log('[Approve] Step 2: Checking for duplicates / existing team');

      let teamId = options?.reuseExistingTeamId || '';

      if (!teamId) {
        const existingTeams = await getTeams(tournamentId);
        const duplicate = existingTeams.find(
          (t) => t.teamName.toLowerCase().trim() === reg.teamName.toLowerCase().trim()
        );

        if (duplicate && !options?.overrideName) {
          // If the squad was already created from a previous attempt by the same captain, reuse it smoothly!
          const isSameSquad =
            !duplicate.captainEmail ||
            !reg.captainEmail ||
            duplicate.captainEmail.toLowerCase().trim() === reg.captainEmail.toLowerCase().trim() ||
            duplicate.captainName?.toLowerCase().trim() === reg.captainName?.toLowerCase().trim();

          if (isSameSquad) {
            console.log('[Approve] Squad already provisioned in previous attempt, continuing with team ID:', duplicate.id);
            teamId = duplicate.id;
          } else {
            // Collision with another squad! Prompt user with modal for choice: Rename or Replace
            console.log('[Approve] Name collision detected. Opening DuplicateTeamModal.');
            clearApproveTimeout();
            setApprovingId(null);
            setDuplicateRegTarget(reg);
            setDuplicateExistingTeam({ id: duplicate.id, name: duplicate.teamName });
            setDuplicateModalOpen(true);
            return;
          }
        }
      }

      if (!teamId) {
        // ─── STEP 3: Create team ───────────────────────────────────────
        console.log('[Approve] Step 3: Creating team in Firestore');

        const finalTeamName = options?.overrideName || reg.teamName;

        teamId = await createTeam(tournamentId, {
          teamName: finalTeamName,
          teamTag: reg.teamTag || '',
          captainName: reg.captainName,
          captainPhone: reg.captainPhone,
          captainEmail: reg.captainEmail,
          logoUrl: reg.logoUrl || '',
          mode: reg.mode,
          registeredAt: new Date().toISOString(),
        });

        console.log('[Approve] Step 3 passed — teamId:', teamId);
      }

      // ─── STEP 4: Create members ────────────────────────────────────
      console.log('[Approve] Step 4: Creating members');

      const players = Array.isArray(reg.players) ? reg.players : [];

      if (players.length > 0) {
        const existingMembers = await getMembers(tournamentId, teamId).catch(() => []);
        const existingUids = new Set(existingMembers.map((m) => m.gameUid));

        for (let i = 0; i < players.length; i++) {
          const p = players[i];
          if (!p.uid || existingUids.has(p.uid)) continue;

          console.log(`[Approve] Creating member ${i + 1}:`, p.ign || p.uid);

          await createMember(tournamentId, teamId, {
            gameUid: p.uid,
            displayName: p.name || p.ign || '',
            ign: p.ign || '',
            email: p.email || '',
            isCaptain: i === 0,
            isSubstitute: i >= 4,
            joinedAt: new Date().toISOString(),
          });
        }
      }

      console.log('[Approve] Step 4 passed');

      // ─── STEP 5: Update registration status ────────────────────────
      console.log('[Approve] Step 5: Updating registration status');

      await updateRegistration(reg.id, {
        status: 'approved',
        paymentStatus: 'verified',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.email || (isCreatorUnlocked ? 'creator' : 'admin'),
      });

      console.log('[Approve] Step 5 passed');

      // ─── STEP 6: Log audit (non-critical) ──────────────────────────
      try {
        await logAudit('approve_registration', 'registration', reg.id, {
          teamName: reg.teamName,
          teamId,
        });
        console.log('[Approve] Step 6 passed');
      } catch (auditErr) {
        console.warn('[Approve] Audit log failed (non-critical):', auditErr);
      }

      // SEND EMAIL (if EmailJS configured)
      try {
        await sendRegistrationApproved(
          { email: reg.captainEmail, name: reg.captainName },
          reg.teamName,
          'GS Arena'
        );
      } catch (emailErr) {
        console.warn('[Approve] Email failed (non-critical):', emailErr);
      }

      // ─── SUCCESS ───────────────────────────────────────────────────
      clearApproveTimeout();
      console.log('[Approve] ✅ ALL STEPS COMPLETE for', reg.teamName);

      setApprovingId(null);
      setError(null);
      setCardErrors((prev) => {
        const next = { ...prev };
        delete next[reg.id];
        return next;
      });
      const okMsg = `✅ "${reg.teamName}" approved successfully`;
      setSuccessMsg(okMsg);
      setCardSuccess((prev) => ({ ...prev, [reg.id]: okMsg }));


      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMsg(null);
        setCardSuccess((prev) => {
          const next = { ...prev };
          delete next[reg.id];
          return next;
        });
      }, 4000);
    } catch (err) {
      clearApproveTimeout();

      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Approve] ❌ FAILED at some step:', err);
      console.error('[Approve] Error message:', message);

      setError(message);
      setCardErrors((prev) => ({ ...prev, [reg.id]: message }));
      setApprovingId(null);
    }
  };

  // REJECT MODAL TRIGGER
  const openRejectDialog = (reg: Registration) => {
    setRegistrationToReject(reg);
    setRejectionReason(
      reg.rejectionReason || 'Payment reference or screenshot could not be verified by administrator.'
    );
    setRejectModalOpen(true);
  };

  // CONFIRM REJECTION ACTION
  const confirmReject = async () => {
    if (!registrationToReject) return;
    const reg = registrationToReject;
    const finalReason =
      rejectionReason.trim() || 'Payment reference or roster could not be verified by administrator.';

    setProcessingId(reg.id);
    setActionNotice(null);
    try {
      // 1. Update registration in Firestore and local storage cache
      await updateRegistration(reg.id, {
        status: 'rejected',
        paymentStatus: 'failed',
        rejectionReason: finalReason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.email || (isCreatorUnlocked ? 'creator' : 'admin'),
      });

      // 2. Audit log
      logAudit('reject_registration', 'registration', reg.id, {
        teamName: reg.teamName,
        reason: finalReason,
        admin: user?.email || (isCreatorUnlocked ? 'creator' : 'admin'),
      }).catch(() => {});

      // 3. Email notification (non-blocking)
      sendRegistrationRejected(
        { name: reg.captainName, email: reg.captainEmail },
        reg.teamName,
        finalReason
      ).catch((emailErr) => console.warn('Rejection email notice:', emailErr));

      setActionNotice(`❌ Rejected squad "${reg.teamName}". Reason: ${finalReason}`);
      setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
      setRejectModalOpen(false);
      setRegistrationToReject(null);
    } catch (err: unknown) {
      console.error('Failed to reject registration:', err);
      setActionNotice(
        `Failed to reject registration: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // MANUAL DELETE TEAM / REGISTRATION TRIGGER
  const openDeleteDialog = (reg: Registration) => {
    setRegistrationToDelete(reg);
    setDeleteModalOpen(true);
  };

  // CONFIRM MANUAL DELETE TEAM
  const confirmDeleteTeam = async () => {
    if (!registrationToDelete) return;
    const reg = registrationToDelete;
    setProcessingId(reg.id);
    setActionNotice(null);

    try {
      // 1. Delete registration document
      await deleteRegistration(reg.id);

      // 2. If team was previously approved in tournament, clean up tournament team doc
      if (reg.tournamentId) {
        deleteTeam(reg.tournamentId, reg.id).catch(() => {});
      }

      // 3. Log audit event
      logAudit('delete_team', 'registration', reg.id, {
        teamName: reg.teamName,
        game: reg.game,
        admin: user?.email || 'admin',
      }).catch(() => {});

      setActionNotice(`🗑️ Permanently deleted team "${reg.teamName}".`);
      setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
      setDeleteModalOpen(false);
      setRegistrationToDelete(null);
    } catch (err: unknown) {
      console.error('Failed to delete team:', err);
      setActionNotice(
        `Failed to delete team: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // BATCH DELETE TEAMS
  const confirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setProcessingId('batch');
    let deleteCount = 0;

    for (const id of selectedIds) {
      const reg = currentList.find((r) => r.id === id);
      if (reg) {
        try {
          await deleteRegistration(reg.id);
          if (reg.tournamentId) {
            deleteTeam(reg.tournamentId, reg.id).catch(() => {});
          }
          deleteCount++;
        } catch {
          // continue
        }
      }
    }

    setActionNotice(`🗑️ Permanently deleted ${deleteCount} team(s).`);
    setSelectedIds([]);
    setBatchDeleteModalOpen(false);
    setProcessingId(null);
  };

  // Open note modal
  const openNoteDialog = (reg: Registration) => {
    setRegistrationForNote(reg);
    setNoteText(reg.notes || '');
    setNoteModalOpen(true);
  };

  const saveNote = async () => {
    if (!registrationForNote) return;
    try {
      await updateRegistration(registrationForNote.id, {
        notes: noteText.trim(),
      });
      setActionNotice(`📝 Note saved for "${registrationForNote.teamName}".`);
      setNoteModalOpen(false);
      setRegistrationForNote(null);
    } catch (err: unknown) {
      setActionNotice(`Failed to save note: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  // Batch selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map((r) => r.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setProcessingId('batch');
    let successCount = 0;
    for (const id of selectedIds) {
      const reg = currentList.find((r) => r.id === id);
      if (reg && reg.status === 'pending') {
        try {
          await handleApprove(reg);
          successCount++;
        } catch {
          // continue
        }
      }
    }
    setActionNotice(`✅ Batch approved ${successCount} squad(s).`);
    setSelectedIds([]);
    setProcessingId(null);
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    setProcessingId('batch');
    let rejectCount = 0;
    const defaultReason = 'Payment reference or roster could not be verified by administrator.';
    for (const id of selectedIds) {
      const reg = currentList.find((r) => r.id === id);
      if (reg && reg.status === 'pending') {
        try {
          await updateRegistration(reg.id, {
            status: 'rejected',
            paymentStatus: 'failed',
            rejectionReason: defaultReason,
            reviewedAt: new Date().toISOString(),
            reviewedBy: user?.email || 'admin',
          });

          logAudit('reject_registration', 'registration', reg.id, {
            teamName: reg.teamName,
            reason: defaultReason,
            admin: user?.email || 'admin',
          }).catch(() => {});

          sendRegistrationRejected(
            { name: reg.captainName, email: reg.captainEmail },
            reg.teamName,
            defaultReason
          ).catch(() => {});

          rejectCount++;
        } catch {
          // continue
        }
      }
    }
    setActionNotice(`❌ Batch rejected ${rejectCount} squad(s).`);
    setSelectedIds([]);
    setProcessingId(null);
  };

  const openScreenshot = (reg: Registration) => {
    setActiveScreenshotUrl(reg.paymentScreenshotUrl || '');
    setActiveScreenshotTeam(reg.teamName);
    setActiveScreenshotUtr(reg.upiTransactionId || 'N/A');
    setScreenshotModalOpen(true);
  };

  // Helper for human-readable relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Level Error / Success Notices */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-start gap-2.5">
          <span className="text-base">❌</span>
          <div className="flex-1">
            <strong>Approval failed:</strong> {error}
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {activeTabLabel}
            </span>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              APPROVAL & TEAM MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif] text-4xl">
            <CheckSquare className="w-8 h-8 text-orange-400" />
            Squad Verification & Approvals
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Single-step squad verification. Inspect team rosters, payment proof, approve with 1-click, reject with reason, or manually delete teams.
          </p>
        </div>

        {/* Sub-Tab Switcher: BGMI BR | Free Fire BR | Free Fire CS */}
        <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setSubTab('BGMI_BR');
              setSelectedIds([]);
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              subTab === 'BGMI_BR'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>BGMI BR</span>
            {bgmiBrPending > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200">
                {bgmiBrPending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('FF_BR');
              setSelectedIds([]);
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              subTab === 'FF_BR'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Free Fire BR</span>
            {ffBrPending > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200">
                {ffBrPending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('FF_CS');
              setSelectedIds([]);
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              subTab === 'FF_CS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Free Fire CS</span>
            {ffCsPending > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-rose-200">
                {ffCsPending}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs: Pending | Approved | Rejected | All */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'all'
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <span>All ({gameRegistrations.length})</span>
          </button>
        </div>

        <span className="text-xs text-gray-400 font-mono">
          Showing {currentList.length} squad(s)
        </span>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
          <span>{actionNotice}</span>
          <div className="flex items-center gap-2 shrink-0">
            {statusFilter === 'pending' && actionNotice.includes('Rejected squad') && (
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-colors"
              >
                View in Rejected Queue →
              </button>
            )}
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Controls Bar */}
      {currentList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedIds.length === currentList.length && currentList.length > 0}
              onChange={toggleSelectAll}
              className="rounded accent-orange-500 cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs font-semibold text-gray-300 cursor-pointer">
              Select All ({currentList.length} Teams)
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBatchDeleteModalOpen(true)}
                disabled={processingId !== null}
                className="text-xs text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </Button>

              {statusFilter === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBatchReject}
                    disabled={processingId !== null}
                    className="text-xs text-amber-400 hover:bg-amber-500/10"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Selected ({selectedIds.length})</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleBatchApprove}
                    disabled={processingId !== null}
                    className="text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Selected ({selectedIds.length})</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Registration Cards List */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
          title={`No squads found in ${statusFilter} status`}
          description={`There are currently no registrations for ${activeTabLabel} in '${statusFilter}'.`}
        />
      ) : (
        <div className="space-y-5">
          {currentList.map((reg) => {
            const isSelected = selectedIds.includes(reg.id);
            const isBusy = processingId === reg.id || processingId === 'batch';

            return (
              <Card
                key={reg.id}
                className={cn(
                  'relative transition-all p-5 sm:p-6 border border-white/10 bg-black/50 space-y-5',
                  isSelected && 'border-orange-500/50 bg-orange-500/[0.03]',
                  reg.status === 'rejected' && 'border-rose-500/20 bg-rose-500/[0.01]',
                  reg.status === 'approved' && 'border-emerald-500/20 bg-emerald-500/[0.01]'
                )}
              >
                {/* Header: Logo, Team, Tag, and Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(reg.id)}
                      className="mt-1.5 rounded accent-orange-500 cursor-pointer"
                    />

                    {reg.logoUrl ? (
                      <img
                        src={reg.logoUrl}
                        alt={reg.teamName}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shrink-0 bg-black"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-md">
                        {reg.teamName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-white font-['Teko',sans-serif] tracking-wide leading-none">
                          {reg.teamName}
                        </h3>
                        {reg.teamTag && (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Tag: {reg.teamTag}
                          </span>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200 uppercase">
                          {reg.mode} Mode
                        </span>
                      </div>

                      {/* Captain Contact Information */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          <User className="w-3.5 h-3.5 text-orange-400" />
                          Captain: {reg.captainName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <code className="font-mono text-slate-200">{reg.captainPhone}</code>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {reg.captainEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    {reg.status === 'approved' ? (
                      <TagChip label="APPROVED" variant="success" size="md" />
                    ) : reg.status === 'rejected' ? (
                      <TagChip label="REJECTED" variant="danger" size="md" />
                    ) : (
                      <TagChip label="PENDING APPROVAL" variant="warn" size="md" />
                    )}
                    <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Submitted: {getRelativeTime(reg.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* If rejected, prominently display the rejection reason */}
                {reg.status === 'rejected' && reg.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <strong className="block text-rose-200">Rejection Reason:</strong>
                      <span>{reg.rejectionReason}</span>
                    </div>
                  </div>
                )}

                {/* ROSTER SECTION */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
                    ROSTER ({reg.players?.length || 0} Players):
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-mono text-xs">
                        <tr>
                          <th className="py-2.5 px-3">UID</th>
                          <th className="py-2.5 px-3">IGN / Display Name</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Player Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reg.players?.map((p, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 font-mono font-bold text-amber-300">
                              {p.uid}
                            </td>
                            <td className="py-2 px-3 text-white font-medium">
                              {p.ign || p.name}
                            </td>
                            <td className="py-2 px-3">
                              {idx === 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                                  Captain 👑
                                </span>
                              ) : idx >= 4 ? (
                                <span className="text-xs text-slate-400 font-medium">
                                  Substitute
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">Player</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]">
                              {p.email || reg.captainEmail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PAYMENT PROOF SECTION */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block font-mono">
                    PAYMENT PROOF:
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-5 text-xs">
                      <div>
                        <span className="text-slate-300 block text-xs uppercase font-mono">
                          Registration Fee
                        </span>
                        <strong className="text-emerald-300 font-mono text-base font-bold">
                          ₹{reg.registrationFeePaid || 100}
                        </strong>
                      </div>

                      <div className="h-8 w-px bg-white/10 hidden sm:block" />

                      <div>
                        <span className="text-slate-300 block text-xs uppercase font-mono">
                          UPI UTR Reference
                        </span>
                        <code className="text-sm font-mono font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 select-all">
                          {reg.upiTransactionId || 'No UTR provided'}
                        </code>
                      </div>
                    </div>

                    {/* Screenshot Preview Trigger */}
                    <div>
                      {reg.paymentScreenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => openScreenshot(reg)}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Screenshot 🔍</span>
                        </button>
                      ) : (
                        <span className="text-xs text-rose-400 italic">No receipt screenshot</span>
                      )}
                    </div>
                  </div>

                  {reg.notes && (
                    <div className="pt-2 border-t border-white/5 text-xs text-gray-300 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Admin Note:</strong> {reg.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Level Error / Success Banner above actions */}
                {(cardErrors[reg.id] || cardSuccess[reg.id]) && (
                  <div className="pt-2">
                    {cardErrors[reg.id] && (
                      <div className="text-xs p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-2 animate-in fade-in">
                        <span className="font-medium">⚠️ {cardErrors[reg.id]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCardErrors((prev) => {
                              const next = { ...prev };
                              delete next[reg.id];
                              return next;
                            });
                          }}
                          className="text-rose-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {cardSuccess[reg.id] && (
                      <div className="text-xs p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-medium animate-in fade-in">
                        {cardSuccess[reg.id]}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openNoteDialog(reg)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{reg.notes ? 'Edit Note' : '📝 Add Note'}</span>
                    </Button>

                    {/* MANUAL DELETE BUTTON FOR CREATOR/ADMIN */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(reg)}
                      disabled={isBusy}
                      className="text-xs text-rose-400 hover:bg-rose-500/10"
                      title="Permanently delete this team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Team</span>
                    </Button>
                  </div>

                  {/* APPROVE & REJECT ACTIONS FOR PENDING SQUADS */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {reg.status !== 'rejected' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRejectDialog(reg)}
                        disabled={isBusy}
                        className="text-rose-400 hover:bg-rose-500/10 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>❌ Reject</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRejectDialog(reg)}
                        disabled={isBusy}
                        className="text-amber-300 hover:bg-amber-500/10 text-xs"
                        title="Edit reason or re-reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>✏️ Edit Reason</span>
                      </Button>
                    )}

                    {/* Approve Button with 4 distinct states: Idle, Loading, Success, Error/Retry */}
                    {reg.status === 'approved' || cardSuccess[reg.id] ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-emerald-600/40 border border-emerald-500/60 cursor-not-allowed flex items-center gap-1.5"
                      >
                        <span>✅ Approved</span>
                      </button>
                    ) : approvingId === reg.id ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-orange-600/70 border border-orange-500/50 cursor-wait flex items-center gap-2 opacity-90"
                      >
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>⏳ Provisioning...</span>
                      </button>
                    ) : cardErrors[reg.id] ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(reg)}
                        className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-950/40 border border-amber-400/40"
                        title="Retry Provisioning"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>🔄 Retry</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(reg)}
                        className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
                      >
                        <span>✅ Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SCREENSHOT FULL PREVIEW MODAL */}
      <Modal
        open={screenshotModalOpen}
        onClose={() => setScreenshotModalOpen(false)}
        title={`Payment Receipt — ${activeScreenshotTeam}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-300 pb-2 border-b border-white/10 font-mono">
            <span>UTR: <strong className="text-amber-300">{activeScreenshotUtr}</strong></span>
          </div>
          <div className="w-full max-h-[70vh] bg-black/80 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-white/10">
            {activeScreenshotUrl ? (
              <img
                src={activeScreenshotUrl}
                alt="Payment Receipt"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs">
                No screenshot data available.
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setScreenshotModalOpen(false)}
            >
              Close Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL WITH REJECTION REASON PROMPT */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Squad Registration"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Specify the reason for rejecting <strong className="text-white">{registrationToReject?.teamName}</strong>. 
            This reason will be stored as <code className="font-mono text-rose-300">rejectionReason</code> on the registration record and an automated rejection notice will be dispatched to <strong className="text-white">{registrationToReject?.captainEmail}</strong>.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block font-mono">
              Reason for Rejection *
            </label>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Invalid or unverified UTR reference',
                'Payment screenshot unreadable or missing',
                'Duplicate player UID in roster',
                'Payment amount does not match entry fee',
                'Incomplete roster or invalid captain contact',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer text-left"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-rose-500"
              placeholder="e.g. UTR number is invalid or screenshot doesn't match the fee."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmReject}
              disabled={processingId !== null}
            >
              {processingId === registrationToReject?.id ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MANUAL DELETE SINGLE TEAM CONFIRMATION MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Team Permanently"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white font-bold">{registrationToDelete?.teamName}</strong>? 
              This will remove the registration document, roster entries, and payment proof. This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteTeam}
              disabled={processingId !== null}
            >
              {processingId === registrationToDelete?.id ? 'Deleting...' : '🗑️ Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* BATCH DELETE CONFIRMATION MODAL */}
      <Modal
        open={batchDeleteModalOpen}
        onClose={() => setBatchDeleteModalOpen(false)}
        title="Delete Selected Teams"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to permanently delete the <strong className="text-white font-bold">{selectedIds.length}</strong> selected squads? 
              Their rosters and registration records will be permanently erased.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBatchDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmBatchDelete}
              disabled={processingId !== null}
            >
              {processingId === 'batch' ? 'Deleting...' : `Delete ${selectedIds.length} Teams`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADMIN NOTE MODAL */}
      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={`Admin Note — ${registrationForNote?.teamName}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Internal Admin Note
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full text-xs bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-orange-500"
              placeholder="e.g. Verified with organizer on WhatsApp. Special invite squad."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={saveNote}>
              Save Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* DUPLICATE SQUAD RESOLUTION MODAL */}
      {duplicateRegTarget && (
        <DuplicateTeamModal
          open={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setApprovingId(null);
            setDuplicateRegTarget(null);
            setDuplicateExistingTeam(null);
          }}
          teamName={duplicateRegTarget.teamName}
          registrationId={duplicateRegTarget.id}
          onRename={(renamedTeamName) => {
            const target = duplicateRegTarget;
            setDuplicateModalOpen(false);
            setDuplicateRegTarget(null);
            setDuplicateExistingTeam(null);
            if (target) {
              handleApprove(target, { overrideName: renamedTeamName });
            }
          }}
          onReplace={() => {
            const target = duplicateRegTarget;
            const existingId = duplicateExistingTeam?.id;
            setDuplicateModalOpen(false);
            setDuplicateRegTarget(null);
            setDuplicateExistingTeam(null);
            if (target && existingId) {
              handleApprove(target, { reuseExistingTeamId: existingId });
            }
          }}
        />
      )}
    </div>
  );
}
