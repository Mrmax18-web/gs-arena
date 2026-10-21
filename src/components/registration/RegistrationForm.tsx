import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Tournament } from '../../types/tournament';
import { GameId } from '../../types/game';
import { useGame } from '../../context/GameContext';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Stepper, StepItem } from '../ui/Stepper';
import { InlineNotice } from '../ui/InlineNotice';
import { useToast } from '../ui/Toast';
import { RegistrationSchema } from '../../lib/validators';
import { uploadFile, deleteStorageFile, validateImageFile } from '../../services/storageService';
import { MANDATORY_POLICIES, RULES_VERSION } from '../../lib/rulesConstants';
import { Icon } from '@iconify/react';

export interface RegistrationFormProps {
  tournaments: Tournament[];
  defaultTournamentId?: string;
  onSuccess?: (details: { teamName: string; leaderEmail: string; tournamentName: string }) => void;
}

const REGISTRATION_STEPS: StepItem[] = [
  { id: 'details', title: 'Details', description: 'Game & Leader' },
  { id: 'payment', title: 'Payment', description: 'Fee & Verification' },
  { id: 'players', title: 'Players', description: 'Roster & Compliance' },
];

const GAME_OPTIONS: Array<{ id: GameId; label: string; icon: string }> = [
  { id: 'BGMI', label: 'BGMI', icon: 'solar:gamepad-bold' },
  { id: 'FF_BR', label: 'Free Fire BR', icon: 'solar:fire-bold' },
  { id: 'FF_CS', label: 'Free Fire CS', icon: 'solar:shield-bold' },
];

/**
 * RegistrationForm enables public competitive teams to register without Firebase Authentication.
 * Writes directly to the Firestore `registrations` collection via addDoc with serverTimestamp.
 */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  tournaments,
  defaultTournamentId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { gameId: activeGlobalGameId, setGameId: setGlobalGameId } = useGame();
  const { success, error, info } = useToast();

  // Find initial tournament if defaultTournamentId provided
  const initialTournament = useMemo(() => {
    if (defaultTournamentId) {
      return tournaments.find((t) => t.id === defaultTournamentId);
    }
    return undefined;
  }, [defaultTournamentId, tournaments]);

  // Selected game state
  const [selectedGame, setSelectedGame] = useState<GameId>(() => {
    if (initialTournament?.gameId) return initialTournament.gameId;
    return activeGlobalGameId || 'BGMI';
  });

  // Filter open tournaments for the selected game
  const openTournamentsForGame = useMemo(() => {
    return tournaments.filter((t) => t.registrationOpen && t.gameId === selectedGame);
  }, [tournaments, selectedGame]);

  // Tournament ID state
  const [tournamentId, setTournamentId] = useState<string>(() => {
    if (initialTournament && initialTournament.registrationOpen) {
      return initialTournament.id;
    }
    const matching = tournaments.find((t) => t.registrationOpen && t.gameId === selectedGame);
    return matching?.id || '';
  });

  // Keep tournament selection updated when game changes
  const handleGameSelect = (newGameId: GameId) => {
    setSelectedGame(newGameId);
    setGlobalGameId(newGameId);
    const available = tournaments.filter((t) => t.registrationOpen && t.gameId === newGameId);
    if (available.length > 0) {
      setTournamentId(available[0].id);
    } else {
      setTournamentId('');
    }
  };

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState(0);

  // Form fields: Team & Leader
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');

  // Form fields: 4 Players (Name + UID)
  const [player1Name, setPlayer1Name] = useState('');
  const [player1Uid, setPlayer1Uid] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player2Uid, setPlayer2Uid] = useState('');
  const [player3Name, setPlayer3Name] = useState('');
  const [player3Uid, setPlayer3Uid] = useState('');
  const [player4Name, setPlayer4Name] = useState('');
  const [player4Uid, setPlayer4Uid] = useState('');

  // Form fields: Payment & Verification
  const [otr, setOtr] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [screenshotUploadProgress, setScreenshotUploadProgress] = useState<number | null>(null);
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Submission & UI status
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    teamName: string;
    leaderName: string;
    leaderEmail: string;
    leaderPhone: string;
    tournamentName: string;
    registrationId: string;
  } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  // Auto-fill test data helper
  const [backupForm, setBackupForm] = useState<Record<string, string> | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const handleAutoFill = () => {
    setBackupForm({
      teamName,
      leaderName,
      leaderEmail,
      leaderPhone,
      player1Name,
      player1Uid,
      player2Name,
      player2Uid,
      player3Name,
      player3Uid,
      player4Name,
      player4Uid,
    });
    setTeamName('Phoenix Squad');
    setLeaderName('Arjun Sharma');
    setLeaderEmail('leader@phoenix.gg');
    setLeaderPhone('9876543210');
    setPlayer1Name('PHX_Sniper');
    setPlayer1Uid('10001001');
    setPlayer2Name('PHX_Rusher');
    setPlayer2Uid('10001002');
    setPlayer3Name('PHX_IGL');
    setPlayer3Uid('10001003');
    setPlayer4Name('PHX_Support');
    setPlayer4Uid('10001004');
    setAutoFilled(true);
  };

  const handleUndoAutoFill = () => {
    if (!backupForm) return;
    setTeamName(backupForm.teamName || '');
    setLeaderName(backupForm.leaderName || '');
    setLeaderEmail(backupForm.leaderEmail || '');
    setLeaderPhone(backupForm.leaderPhone || '');
    setPlayer1Name(backupForm.player1Name || '');
    setPlayer1Uid(backupForm.player1Uid || '');
    setPlayer2Name(backupForm.player2Name || '');
    setPlayer2Uid(backupForm.player2Uid || '');
    setPlayer3Name(backupForm.player3Name || '');
    setPlayer3Uid(backupForm.player3Uid || '');
    setPlayer4Name(backupForm.player4Name || '');
    setPlayer4Uid(backupForm.player4Uid || '');
    setBackupForm(null);
    setAutoFilled(false);
  };

  // Upload Payment Screenshot via Supabase Storage
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      error('Invalid Image', validation.error || 'Please choose a JPEG, PNG, or WebP under 5 MB.');
      return;
    }

    try {
      const guestPrefix = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ext = file.name.split('.').pop() || 'jpg';
      const targetTid = tournamentId || 'general';
      const path = `tournaments/${targetTid}/payments/${guestPrefix}.${ext}`;

      setScreenshotUploadProgress(0);
      const { promise } = uploadFile(path, file, {
        onProgress: (pct) => setScreenshotUploadProgress(pct),
      });

      const url = await promise;
      setPaymentScreenshotUrl(url);
      setScreenshotUploadProgress(null);
      info('Screenshot Uploaded', 'Payment receipt attached successfully.');
    } catch (err: any) {
      setScreenshotUploadProgress(null);
      console.error('[Registration] Screenshot upload error:', err);
      error('Upload Failed', err?.message || 'Could not upload payment screenshot.');
    }
  };

  const handleRemoveScreenshot = async () => {
    if (paymentScreenshotUrl) {
      await deleteStorageFile(paymentScreenshotUrl);
      setPaymentScreenshotUrl('');
    }
  };

  // Upload Team Logo via Supabase Storage
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      error('Invalid Image', validation.error || 'Please choose a JPEG, PNG, or WebP under 5 MB.');
      return;
    }

    try {
      const targetTid = tournamentId || 'general';
      const path = `tournaments/${targetTid}/logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      setLogoUploadProgress(0);
      const { promise } = uploadFile(path, file, {
        onProgress: (pct) => setLogoUploadProgress(pct),
      });

      const url = await promise;
      setTeamLogoUrl(url);
      setLogoUploadProgress(null);
      info('Logo Uploaded', 'Team emblem attached successfully.');
    } catch (err: any) {
      setLogoUploadProgress(null);
      console.error('[Registration] Logo upload error:', err);
      error('Upload Failed', err?.message || 'Could not upload team logo.');
    }
  };

  const handleRemoveLogo = async () => {
    if (teamLogoUrl) {
      await deleteStorageFile(teamLogoUrl);
      setTeamLogoUrl('');
    }
  };

  // Step 1 Validation -> advance to Step 2
  const handleNextStep1 = () => {
    setStepError(null);
    setFieldErrors({});

    if (!tournamentId) {
      setStepError(`Please select an active ${selectedGame} tournament to register for.`);
      return;
    }

    if (!teamName.trim() || teamName.trim().length < 2 || teamName.trim().length > 40) {
      setFieldErrors((prev) => ({ ...prev, teamName: 'Team name must be between 2 and 40 characters.' }));
      setStepError('Please enter a valid Team Name.');
      return;
    }

    if (!leaderName.trim() || leaderName.trim().length < 2 || leaderName.trim().length > 50) {
      setFieldErrors((prev) => ({ ...prev, leaderName: 'Leader name must be between 2 and 50 characters.' }));
      setStepError('Please enter the Team Leader full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leaderEmail.trim() || !emailRegex.test(leaderEmail.trim())) {
      setFieldErrors((prev) => ({ ...prev, leaderEmail: 'Please enter a valid leader email address.' }));
      setStepError('Valid leader email required for room credentials dispatch.');
      return;
    }

    const cleanPhone = leaderPhone.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFieldErrors((prev) => ({ ...prev, leaderPhone: 'Enter a valid 10-digit Indian mobile number.' }));
      setStepError('10-digit Indian mobile number required (admins contact leaders by phone).');
      return;
    }

    setCurrentStep(1);
    setMaxAccessibleStep((m) => Math.max(m, 1));
  };

  const entryFeeINR = (selectedTournament?.entryFeePaise ?? 0) / 100;

  // Step 2 Validation -> advance to Step 3
  const handleNextStep2 = () => {
    setStepError(null);
    setFieldErrors({});

    if (entryFeeINR > 0) {
      if (!otr.trim() || otr.trim().length < 6) {
        setFieldErrors((prev) => ({ ...prev, otr: 'Please provide valid UTR / OTR reference (min 6 characters).' }));
        setStepError('Payment transaction reference (UTR) is required.');
        return;
      }
      if (!paymentScreenshotUrl) {
        setStepError('Please upload your UPI payment receipt screenshot.');
        return;
      }
    }

    setCurrentStep(2);
    setMaxAccessibleStep((m) => Math.max(m, 2));
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setStepError(null);
    setFieldErrors({});

    if (!db) {
      const msg = 'Firestore database service is unavailable. Please check your internet connection.';
      setStepError(msg);
      error('Database Unavailable', msg);
      return;
    }

    let normalizedOtr = otr.trim().toUpperCase();
    if (entryFeeINR === 0 && !normalizedOtr) {
      normalizedOtr = 'FREE-ENTRY-' + Date.now().toString().slice(-6);
    }

    if (entryFeeINR > 0 && !paymentScreenshotUrl) {
      setStepError('Please upload your payment receipt screenshot before submitting.');
      error('Missing Payment Proof', 'Paid entry tournaments require a verified payment screenshot.');
      return;
    }

    let finalScreenshotUrl = paymentScreenshotUrl;
    if (entryFeeINR === 0 && !finalScreenshotUrl) {
      finalScreenshotUrl = 'https://gs-arena.vercel.app/free-entry.png';
    }

    // UID duplicate check
    const playersList = [
      { name: player1Name.trim(), uid: player1Uid.trim() },
      { name: player2Name.trim(), uid: player2Uid.trim() },
      { name: player3Name.trim(), uid: player3Uid.trim() },
      { name: player4Name.trim(), uid: player4Uid.trim() },
    ];

    const uids = playersList.map((p) => p.uid);
    const uniqueUids = new Set(uids.filter(Boolean));
    if (uniqueUids.size < 4) {
      setStepError('Each player must have a unique In-Game UID. Duplicate UIDs found.');
      error('Duplicate Player UID', 'Player In-Game UIDs must be distinct within the squad roster.');
      return;
    }

    const formData = {
      tournamentId,
      gameId: selectedGame,
      teamName: teamName.trim(),
      leaderName: leaderName.trim(),
      leaderEmail: leaderEmail.trim().toLowerCase(),
      leaderPhone: leaderPhone.replace(/\s+/g, '').replace(/^\+91/, ''),
      players: playersList,
      otr: normalizedOtr,
      paymentScreenshotUrl: finalScreenshotUrl,
      teamLogoUrl: teamLogoUrl || undefined,
      rulesAccepted: rulesAccepted as any,
    };

    const validation = RegistrationSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const err of validation.error.errors) {
        const path = err.path.join('.');
        errMap[path] = err.message;
      }
      setFieldErrors(errMap);
      const firstErrMsg = validation.error.errors[0]?.message || 'Please fix form fields before submitting.';
      setStepError(firstErrMsg);
      error('Validation Error', firstErrMsg);
      return;
    }

    setSubmitting(true);

    try {
      // Direct Firestore write to registrations collection with serverTimestamp()
      const regDocData = {
        tournamentId: validation.data.tournamentId,
        gameId: selectedGame,
        teamName: validation.data.teamName,
        leaderName: validation.data.leaderName,
        leaderEmail: validation.data.leaderEmail,
        leaderPhone: validation.data.leaderPhone,
        players: validation.data.players,
        status: 'pending',
        approvalStatus: 'pending',
        paymentStatus: 'pending',
        otr: validation.data.otr,
        paymentScreenshotUrl: validation.data.paymentScreenshotUrl,
        teamLogoUrl: validation.data.teamLogoUrl || null,
        rulesVersion: RULES_VERSION,
        acceptedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'registrations'), regDocData);

      // Best effort OTR claim write for duplicate protection
      try {
        const otrClaimRef = doc(db, 'tournaments', validation.data.tournamentId, 'otrClaims', validation.data.otr);
        await setDoc(otrClaimRef, {
          otr: validation.data.otr,
          tournamentId: validation.data.tournamentId,
          registrationId: docRef.id,
          claimedAt: new Date().toISOString(),
        });
      } catch (claimErr: any) {
        console.warn('[Registration] OTR claim write warning (non-fatal):', claimErr?.message);
      }

      const targetTourney = tournaments.find((t) => t.id === tournamentId);
      const tourneyName = targetTourney?.name || `${selectedGame} Tournament`;

      success('Registration Submitted', 'Your squad registration has been recorded and is pending admin review.');

      setSubmittedData({
        teamName: validation.data.teamName,
        leaderName: validation.data.leaderName,
        leaderEmail: validation.data.leaderEmail,
        leaderPhone: validation.data.leaderPhone,
        tournamentName: tourneyName,
        registrationId: docRef.id,
      });

      if (onSuccess) {
        onSuccess({
          teamName: validation.data.teamName,
          leaderEmail: validation.data.leaderEmail,
          tournamentName: tourneyName,
        });
      }
    } catch (err: any) {
      console.error('[Registration] Submit failure context:', {
        tournamentId,
        teamName,
        leaderEmail,
        error: err,
        code: err?.code,
        message: err?.message,
      });
      const userMessage = err?.message?.includes('permission-denied')
        ? 'Permission denied. Please verify all required fields are filled correctly.'
        : err?.message || 'Failed to submit registration. Please try again.';
      setStepError(userMessage);
      error('Registration Failed', userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Success State View
  if (submittedData) {
    return (
      <GlassCard strong className="max-w-xl mx-auto text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Icon icon="solar:check-circle-bold" className="text-4xl text-emerald-400" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Registration Received
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            Squad Enrolled Successfully!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your team roster has been submitted for{' '}
            <strong className="text-slate-900 dark:text-white">{submittedData.tournamentName}</strong>. Room ID and credentials will be sent to the team leader once verified.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-slate-200/20 dark:border-white/10 text-left space-y-2 text-xs">
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-slate-400">Team Name:</span>
            <span className="font-bold text-white">{submittedData.teamName}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-slate-400">Team Leader:</span>
            <span className="font-semibold text-white">{submittedData.leaderName}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-slate-400">Leader Email:</span>
            <span className="font-mono text-brand-400">{submittedData.leaderEmail}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-slate-400">Leader Phone:</span>
            <span className="font-mono text-amber-400">{submittedData.leaderPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Registration ID:</span>
            <span className="font-mono text-[10px] text-slate-500 select-all">{submittedData.registrationId}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/leaderboard')}
            icon="solar:cup-star-bold"
          >
            View Leaderboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSubmittedData(null);
              setCurrentStep(0);
              setRulesAccepted(false);
              setPaymentScreenshotUrl('');
              setOtr('');
            }}
            icon="solar:restart-bold"
          >
            Register Another Team
          </Button>
        </div>
      </GlassCard>
    );
  }

  const tournamentOptions = openTournamentsForGame.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.status.toUpperCase()})`,
  }));

  return (
    <GlassCard strong className="max-w-2xl mx-auto text-left p-6 sm:p-8">
      {/* Header */}
      <div className="mb-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Team Registration & Payment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete the roster details and submit your payment verification to secure your tournament slot. No player login required.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6">
        <Stepper
          steps={REGISTRATION_STEPS}
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(idx) => setCurrentStep(idx)}
          ariaLabel="Team registration progress"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================= STEP 1: DETAILS ================= */}
        {currentStep === 0 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Game Selector at Top */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Select Esports Title *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GAME_OPTIONS.map((g) => {
                  const active = selectedGame === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGameSelect(g.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-4 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'bg-brand-500/20 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
                          : 'bg-black/20 hover:bg-black/30 border-slate-200/20 dark:border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon icon={g.icon} className="text-lg shrink-0" />
                      <span className="truncate">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-fill Action */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Squad & Leader Details
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  icon="solar:magic-stick-3-bold"
                  onClick={handleAutoFill}
                  title="Auto-fill sample squad details"
                >
                  Auto-fill
                </Button>
                {autoFilled && (
                  <span className="text-xs text-amber-500 font-semibold flex items-center gap-1.5" role="status">
                    <Icon icon="solar:check-circle-bold" />
                    <span>Filled</span>
                    <button
                      type="button"
                      onClick={handleUndoAutoFill}
                      className="text-xs text-slate-400 hover:text-white underline ml-1"
                    >
                      Undo
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Tournament Dropdown if tournaments exist for selected game */}
            {openTournamentsForGame.length > 0 ? (
              <Select
                label={`Select ${selectedGame} Tournament *`}
                options={tournamentOptions}
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                error={fieldErrors['tournamentId']}
                helperText="Tournament slot you are registering for"
              />
            ) : (
              <InlineNotice variant="warning">
                No active tournaments currently open for {selectedGame}. Please choose another game or check back soon.
              </InlineNotice>
            )}

            {/* Team Name & Leader Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Team Name *"
                placeholder="e.g. Phoenix Squad"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                error={fieldErrors['teamName']}
                helperText="2 to 40 characters"
                required
              />
              <Input
                label="Team Leader Full Name *"
                placeholder="e.g. Arjun Sharma"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                error={fieldErrors['leaderName']}
                helperText="Primary point of contact"
                required
              />
            </div>

            {/* Leader Email & Leader Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Team Leader Email *"
                type="email"
                placeholder="leader@phoenix.gg"
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                error={fieldErrors['leaderEmail']}
                helperText="Room credentials will be emailed here"
                required
              />
              <Input
                label="Team Leader Phone (WhatsApp) *"
                type="tel"
                placeholder="e.g. 9876543210"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                error={fieldErrors['leaderPhone']}
                helperText="10-digit Indian mobile number for urgent coordinator dispatch"
                required
              />
            </div>

            {/* Step Error Notice */}
            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep1}
                disabled={openTournamentsForGame.length === 0}
                icon="solar:arrow-right-bold"
              >
                Next: Payment Details
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PAYMENT ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Fee Summary */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    Tournament Entry Fee
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {entryFeeINR > 0 ? `₹${entryFeeINR.toFixed(2)} INR` : 'FREE ENTRY'}
                  </div>
                </div>
                {selectedTournament?.upiId && (
                  <div className="text-xs">
                    <span className="text-slate-400 block font-medium">Official UPI ID:</span>
                    <span className="font-mono font-bold text-amber-500 select-all">
                      {selectedTournament.upiId}
                    </span>
                  </div>
                )}
              </div>

              {selectedTournament?.upiQrUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  <div className="h-32 w-32 rounded-xl bg-white p-2 border border-slate-200 dark:border-white/20 shadow-md flex-shrink-0">
                    <img
                      src={selectedTournament.upiQrUrl}
                      alt="Tournament UPI QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Payment Instructions:
                    </p>
                    <p>1. Scan the UPI QR code above with any UPI app (GPay, PhonePe, Paytm).</p>
                    <p>
                      2. Pay the exact entry fee of <strong className="text-amber-500">₹{entryFeeINR.toFixed(2)}</strong>.
                    </p>
                    <p>
                      3. Note down the <strong>UTR / Reference (OTR)</strong> from your payment receipt and upload the screenshot proof below.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contextual Notice */}
            <InlineNotice variant="info">
              Payment verification is cross-referenced with your 12-digit UPI UTR number prior to bracket assignment.
            </InlineNotice>

            {/* OTR / Reference Number */}
            {entryFeeINR > 0 && (
              <Input
                label="UPI Reference / UTR Number (OTR) *"
                placeholder="e.g. 329182749102"
                value={otr}
                onChange={(e) => setOtr(e.target.value.toUpperCase())}
                error={fieldErrors['otr']}
                helperText="12-digit transaction reference number from payment confirmation"
                required
              />
            )}

            {/* Payment Proof Screenshot Upload */}
            {entryFeeINR > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Payment Proof Screenshot *
                </label>
                {paymentScreenshotUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">
                    <Icon icon="solar:check-circle-bold" className="text-xl text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-medium truncate flex-1">
                      Payment receipt attached successfully
                    </span>
                    <Button variant="ghost" size="sm" type="button" onClick={handleRemoveScreenshot}>
                      Replace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleScreenshotChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20 cursor-pointer"
                    />
                    {screenshotUploadProgress !== null && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${screenshotUploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Uploading: {screenshotUploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {fieldErrors['paymentScreenshotUrl'] && (
                  <p className="text-xs text-rose-500">{fieldErrors['paymentScreenshotUrl']}</p>
                )}
              </div>
            )}

            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(0)}
                icon="solar:arrow-left-bold"
              >
                Back to Details
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep2}
                icon="solar:arrow-right-bold"
              >
                Next: Player Roster
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PLAYERS & POLICIES ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 4 Player Roster: Name & In-Game UID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Player Roster (4 Players — Name & In-Game UID) *
                </label>
                <span className="text-[11px] text-slate-400">All UIDs must be unique</span>
              </div>

              {/* Player 1 */}
              <div className="p-3 rounded-xl bg-black/10 border border-slate-200/20 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Icon icon="solar:user-bold" /> Player 1 (Captain / Starter)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Player 1 Name / IGN"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    error={fieldErrors['players.0.name']}
                    required
                  />
                  <Input
                    placeholder="In-Game UID (numeric)"
                    value={player1Uid}
                    onChange={(e) => setPlayer1Uid(e.target.value.trim())}
                    error={fieldErrors['players.0.uid']}
                    required
                  />
                </div>
              </div>

              {/* Player 2 */}
              <div className="p-3 rounded-xl bg-black/10 border border-slate-200/20 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Icon icon="solar:user-bold" /> Player 2
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Player 2 Name / IGN"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    error={fieldErrors['players.1.name']}
                    required
                  />
                  <Input
                    placeholder="In-Game UID (numeric)"
                    value={player2Uid}
                    onChange={(e) => setPlayer2Uid(e.target.value.trim())}
                    error={fieldErrors['players.1.uid']}
                    required
                  />
                </div>
              </div>

              {/* Player 3 */}
              <div className="p-3 rounded-xl bg-black/10 border border-slate-200/20 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Icon icon="solar:user-bold" /> Player 3
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Player 3 Name / IGN"
                    value={player3Name}
                    onChange={(e) => setPlayer3Name(e.target.value)}
                    error={fieldErrors['players.2.name']}
                    required
                  />
                  <Input
                    placeholder="In-Game UID (numeric)"
                    value={player3Uid}
                    onChange={(e) => setPlayer3Uid(e.target.value.trim())}
                    error={fieldErrors['players.2.uid']}
                    required
                  />
                </div>
              </div>

              {/* Player 4 */}
              <div className="p-3 rounded-xl bg-black/10 border border-slate-200/20 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Icon icon="solar:user-bold" /> Player 4
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Player 4 Name / IGN"
                    value={player4Name}
                    onChange={(e) => setPlayer4Name(e.target.value)}
                    error={fieldErrors['players.3.name']}
                    required
                  />
                  <Input
                    placeholder="In-Game UID (numeric)"
                    value={player4Uid}
                    onChange={(e) => setPlayer4Uid(e.target.value.trim())}
                    error={fieldErrors['players.3.uid']}
                    required
                  />
                </div>
              </div>

              {fieldErrors['players'] && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors['players']}</p>
              )}
            </div>

            {/* Team Logo Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Team Emblem / Logo (Optional)
              </label>
              {teamLogoUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-black/10 text-xs">
                  <img
                    src={teamLogoUrl}
                    alt="Logo preview"
                    className="h-9 w-9 object-contain rounded-lg bg-black/30"
                  />
                  <span className="font-mono text-slate-300 truncate flex-1">Emblem attached</span>
                  <Button variant="ghost" size="sm" type="button" onClick={handleRemoveLogo}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-slate-300 hover:file:bg-white/20 cursor-pointer"
                  />
                  {logoUploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${logoUploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Uploading logo: {logoUploadProgress}%
                      </span>
                    </div>
                  )}
                  <Input
                    placeholder="Or paste logo URL (https://...)"
                    value={teamLogoUrl}
                    onChange={(e) => setTeamLogoUrl(e.target.value)}
                    error={fieldErrors['teamLogoUrl']}
                  />
                </div>
              )}
            </div>

            {/* Mandatory Rules & Policy Summary */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mandatory Competitive Policies
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MANDATORY_POLICIES.map((policy) => (
                  <div
                    key={policy.id}
                    className="p-3 rounded-xl bg-black/20 border border-slate-200/20 dark:border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {policy.title}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                        {policy.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {policy.shortSummary}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rules Agreement Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    required
                  />
                  <span>
                    I acknowledge and accept the 3 mandatory policies above and all official GS Arena rules. I understand that non-compliance leads to automatic forfeit or permanent ban.
                  </span>
                </label>
                {fieldErrors['rulesAccepted'] && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors['rulesAccepted']}</p>
                )}
              </div>
            </div>

            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            {/* Navigation & Submit */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                icon="solar:arrow-left-bold"
              >
                Back to Payment
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                loading={submitting}
                icon="solar:check-read-bold"
              >
                Submit Team Registration
              </Button>
            </div>
          </div>
        )}
      </form>
    </GlassCard>
  );
};
