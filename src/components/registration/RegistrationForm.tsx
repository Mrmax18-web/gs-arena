import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '../../types/tournament';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Stepper, StepItem } from '../ui/Stepper';
import { InlineNotice } from '../ui/InlineNotice';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { RegistrationSchema } from '../../lib/validators';
import { submitRegistration } from '../../services/registrationService';
import { uploadFile, deleteStorageFile, validateImageFile } from '../../services/storageService';
import { MANDATORY_POLICIES } from '../../lib/rulesConstants';
import { Icon } from '@iconify/react';

export interface RegistrationFormProps {
  tournaments: Tournament[];
  defaultTournamentId?: string;
  onSuccess?: (details: { teamName: string; leaderEmail: string; tournamentName: string }) => void;
}

const REGISTRATION_STEPS: StepItem[] = [
  { id: 'details', title: 'Details', description: 'Tournament & Leader' },
  { id: 'payment', title: 'Payment', description: 'Fee & Verification' },
  { id: 'players', title: 'Players', description: 'Roster & Compliance' },
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  tournaments,
  defaultTournamentId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const openTournaments = tournaments.filter((t) => t.registrationOpen);

  const [tournamentId, setTournamentId] = useState<string>(() => {
    if (defaultTournamentId && openTournaments.some((t) => t.id === defaultTournamentId)) {
      return defaultTournamentId;
    }
    return openTournaments[0]?.id || '';
  });

  useEffect(() => {
    if (defaultTournamentId && openTournaments.some((t) => t.id === defaultTournamentId)) {
      setTournamentId(defaultTournamentId);
    }
  }, [defaultTournamentId, openTournaments]);

  const selectedTournament = openTournaments.find((t) => t.id === tournamentId);

  // Stepper state (Law 5)
  const [currentStep, setCurrentStep] = useState(0);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState(0);

  // Form fields
  const [teamName, setTeamName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player3, setPlayer3] = useState('');
  const [player4, setPlayer4] = useState('');
  const [otr, setOtr] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Parkinson's Law (Pre-fill & Auto-fill)
  useEffect(() => {
    // If user is authenticated, pre-fill email if empty
    if (user?.email && !leaderEmail) {
      setLeaderEmail(user.email);
    }
  }, [user, leaderEmail]);

  const [backupForm, setBackupForm] = useState<{
    teamName: string;
    leaderEmail: string;
    player1: string;
    player2: string;
    player3: string;
    player4: string;
  } | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const handleAutoFill = () => {
    setBackupForm({
      teamName,
      leaderEmail,
      player1,
      player2,
      player3,
      player4,
    });
    if (!teamName) setTeamName('Phoenix Squad');
    if (!leaderEmail && user?.email) setLeaderEmail(user.email);
    else if (!leaderEmail) setLeaderEmail('leader@phoenix.gg');
    if (!player1) setPlayer1('PHX_Sniper');
    if (!player2) setPlayer2('PHX_Rusher');
    if (!player3) setPlayer3('PHX_IGL');
    if (!player4) setPlayer4('PHX_Support');
    setAutoFilled(true);
  };

  const handleUndoAutoFill = () => {
    if (!backupForm) return;
    setTeamName(backupForm.teamName);
    setLeaderEmail(backupForm.leaderEmail);
    setPlayer1(backupForm.player1);
    setPlayer2(backupForm.player2);
    setPlayer3(backupForm.player3);
    setPlayer4(backupForm.player4);
    setBackupForm(null);
    setAutoFilled(false);
  };

  // File upload states
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [screenshotUploadProgress, setScreenshotUploadProgress] = useState<number | null>(null);
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  if (openTournaments.length === 0) {
    return (
      <GlassCard className="max-w-md mx-auto text-center py-10">
        <Icon icon="solar:lock-keyhole-bold" className="text-4xl text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Registrations Currently Closed
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          There are currently no active tournaments open for new team registrations for this game title.
        </p>
        <Button variant="secondary" size="sm" className="mt-5" onClick={() => navigate('/leaderboard')}>
          View Current Standings
        </Button>
      </GlassCard>
    );
  }

  // Handle Payment Screenshot Upload
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      error('Invalid Image', validation.error || 'Please choose a JPEG, PNG, or WebP under 5 MB.');
      return;
    }

    try {
      const userPrefix = user?.uid || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `tournaments/${tournamentId}/payments/${userPrefix}_${Date.now()}.${ext}`;

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
      error('Upload Failed', err?.message || 'Could not upload payment screenshot.');
    }
  };

  const handleRemoveScreenshot = async () => {
    if (paymentScreenshotUrl) {
      await deleteStorageFile(paymentScreenshotUrl);
      setPaymentScreenshotUrl('');
    }
  };

  // Handle Team Logo Upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      error('Invalid Image', validation.error || 'Please choose a JPEG, PNG, or WebP under 5 MB.');
      return;
    }

    try {
      const path = `tournaments/${tournamentId}/logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

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
      setStepError('Please select an active tournament.');
      return;
    }
    if (!teamName.trim() || teamName.trim().length < 2 || teamName.trim().length > 40) {
      setFieldErrors({ teamName: 'Team name must be between 2 and 40 characters.' });
      setStepError('Please enter a valid Team Name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leaderEmail.trim() || !emailRegex.test(leaderEmail.trim())) {
      setFieldErrors({ leaderEmail: 'Please enter a valid leader email address.' });
      setStepError('Valid leader email required for room credentials dispatch.');
      return;
    }

    setCurrentStep(1);
    setMaxAccessibleStep((m) => Math.max(m, 1));
  };

  // Step 2 Validation -> advance to Step 3
  const handleNextStep2 = () => {
    setStepError(null);
    setFieldErrors({});
    const entryFeeINR = (selectedTournament?.entryFeePaise ?? 0) / 100;
    if (entryFeeINR > 0) {
      if (!otr.trim() || otr.trim().length < 6) {
        setFieldErrors({ otr: 'Please provide valid UTR / OTR reference (min 6 characters).' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setStepError(null);
    setFieldErrors({});

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

    const formData = {
      tournamentId,
      teamName,
      leaderEmail,
      players: [player1, player2, player3, player4],
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
      setStepError(validation.error.errors[0]?.message || 'Please fix form fields before submitting.');
      error('Validation Error', validation.error.errors[0]?.message || 'Please fix form errors.');
      return;
    }

    setSubmitting(true);
    try {
      const ownerUid = user?.uid || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await submitRegistration(validation.data, ownerUid);

      const targetTourney = openTournaments.find((t) => t.id === tournamentId);

      success('Registration Submitted', 'Your squad registration and payment proof are under review.');
      if (onSuccess) {
        onSuccess({
          teamName,
          leaderEmail,
          tournamentName: targetTourney?.name || 'Tournament',
        });
      } else {
        navigate('/registration/success', {
          state: {
            teamName,
            leaderEmail,
            tournamentName: targetTourney?.name || 'Tournament',
          },
        });
      }
    } catch (err: any) {
      setStepError(err?.message || 'Failed to submit registration.');
      error('Registration Failed', err?.message || 'Failed to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const tournamentOptions = openTournaments.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.status.toUpperCase()})`,
  }));

  const entryFeeINR = (selectedTournament?.entryFeePaise ?? 0) / 100;

  return (
    <GlassCard strong className="max-w-2xl mx-auto text-left p-6 sm:p-8">
      {/* Header */}
      <div className="mb-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Team Registration & Payment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete the roster details and submit your payment verification to secure your tournament slot.
        </p>
      </div>

      {/* Stepper (Law 5: Uniform Connectedness) */}
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
            {/* Parkinson's Law Auto-fill Action */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Squad Details
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
                    <span>Filled sample</span>
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

            {/* Tournament Selection */}
            <Select
              label="Select Tournament"
              options={tournamentOptions}
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              error={fieldErrors['tournamentId']}
            />

            {/* Team Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Team Name"
                placeholder="e.g. Soul Esports"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                error={fieldErrors['teamName']}
                helperText="2 to 40 characters"
                required
              />
              <Input
                label="Team Leader Email"
                type="email"
                placeholder="leader@squad.com"
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                error={fieldErrors['leaderEmail']}
                helperText="Room credentials will be sent here"
                required
              />
            </div>

            {/* Inline Error Notice if any (Law 3) */}
            {stepError && (
              <InlineNotice variant="error">{stepError}</InlineNotice>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep1}
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
            {/* Payment & Fee Summary Box */}
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

            {/* Contextual Inline Notice (Law 3) */}
            <InlineNotice variant="info">
              Payment verification is cross-referenced with your 12-digit UPI UTR number prior to bracket assignment.
            </InlineNotice>

            {/* OTR / Transaction Reference */}
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

            {/* Inline Error Notice if any (Law 3) */}
            {stepError && (
              <InlineNotice variant="error">{stepError}</InlineNotice>
            )}

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
            {/* 4 Player Roster */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Player Roster (4 Unique In-Game IDs) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Player 1 In-Game Name / ID"
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  error={fieldErrors['players.0']}
                  leftIcon="solar:user-bold"
                  required
                />
                <Input
                  placeholder="Player 2 In-Game Name / ID"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  error={fieldErrors['players.1']}
                  leftIcon="solar:user-bold"
                  required
                />
                <Input
                  placeholder="Player 3 In-Game Name / ID"
                  value={player3}
                  onChange={(e) => setPlayer3(e.target.value)}
                  error={fieldErrors['players.2']}
                  leftIcon="solar:user-bold"
                  required
                />
                <Input
                  placeholder="Player 4 In-Game Name / ID"
                  value={player4}
                  onChange={(e) => setPlayer4(e.target.value)}
                  error={fieldErrors['players.3']}
                  leftIcon="solar:user-bold"
                  required
                />
              </div>
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

            {/* Inline Error Notice if any (Law 3) */}
            {stepError && (
              <InlineNotice variant="error">{stepError}</InlineNotice>
            )}

            {/* Submit & Back Navigation */}
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
