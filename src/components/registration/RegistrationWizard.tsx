import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Timer, AlertCircle } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { Step1GameSelect } from './Step1GameSelect';
import { ModeSelectionStep } from './ModeSelectionStep';
import { Step2TeamDetails } from './Step2TeamDetails';
import { Step3Roster, type RosterPlayer } from './Step3Roster';
import { Step4Payment } from './Step4Payment';
import { Step5Success } from './Step5Success';
import { createRegistration, getTournaments } from '../../lib/firestore';
import { usePaymentConfig } from '../../hooks/usePaymentConfig';
import { useCountdown } from '../../hooks/useCountdown';
import { formatDeadlineDateTime } from '../../lib/deadline';
import { fileToBase64 } from '../../lib/fileUtils';
import { Button } from '../ui/Button';
import { useGame } from '../../context/GameContext';
import type { Game, Mode, Tournament } from '../../types';

const DRAFT_KEY = 'registration-draft';

export function RegistrationWizard() {
  const { currentGame, setCurrentGame, currentMode, setCurrentMode } = useGame();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Firestore Payment Config (Dynamic fee & UPI ID)
  const { config: paymentConfig } = usePaymentConfig();

  // Active Tournament & Deadline State
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const countdown = useCountdown(activeTournament?.registrationDeadline);

  // Wizard Form States
  const [selectedGame, setSelectedGame] = useState<Game>(currentGame);
  const [selectedMode, setSelectedMode] = useState<Mode>(currentMode || 'BR');
  const [tournamentId, setTournamentId] = useState<string>('');

  // Team Details
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Player Roster
  const [players, setPlayers] = useState<RosterPlayer[]>([
    { name: '', uid: '', ign: '', email: '' },
    { name: '', uid: '', ign: '' },
    { name: '', uid: '', ign: '' },
    { name: '', uid: '', ign: '' },
  ]);

  // Payment Details
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToNoRematch, setAgreedToNoRematch] = useState(false);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState('');

  // Dynamic Registration Fee based on mode
  const registrationFee =
    selectedMode === 'CS'
      ? (paymentConfig?.registrationFeeCS ?? 150)
      : (paymentConfig?.registrationFeeBR ?? 100);

  // Load existing tournaments filtered by game AND mode
  useEffect(() => {
    async function loadTournaments() {
      try {
        const list = await getTournaments(selectedGame);
        const filtered = list.filter((t) => !t.mode || t.mode === selectedMode);
        if (filtered.length > 0) {
          setTournamentId(filtered[0].id);
          setActiveTournament(filtered[0]);
        } else if (list.length > 0) {
          setTournamentId(list[0].id);
          setActiveTournament(list[0]);
        } else {
          const fallback = `${selectedGame.toLowerCase().replace(/\s+/g, '-')}-${selectedMode.toLowerCase()}-s1`;
          setTournamentId(fallback);
          setActiveTournament(null);
        }
      } catch {
        const fallback = `${selectedGame.toLowerCase().replace(/\s+/g, '-')}-${selectedMode.toLowerCase()}-s1`;
        setTournamentId(fallback);
        setActiveTournament(null);
      }
    }
    loadTournaments();
  }, [selectedGame, selectedMode]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.selectedGame) setSelectedGame(draft.selectedGame);
        if (draft.selectedMode) setSelectedMode(draft.selectedMode);
        if (draft.teamName) setTeamName(draft.teamName);
        if (draft.teamTag) setTeamTag(draft.teamTag);
        if (draft.captainName) setCaptainName(draft.captainName);
        if (draft.captainPhone) setCaptainPhone(draft.captainPhone);
        if (draft.captainEmail) setCaptainEmail(draft.captainEmail);
        if (draft.logoUrl) setLogoUrl(draft.logoUrl);
        if (Array.isArray(draft.players) && draft.players.length >= 4) {
          setPlayers(draft.players);
        }
        if (draft.upiTransactionId) setUpiTransactionId(draft.upiTransactionId);
        if (draft.screenshotPreview) setScreenshotPreview(draft.screenshotPreview);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft on state changes
  useEffect(() => {
    try {
      if (step < 6) {
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            selectedGame,
            selectedMode,
            teamName,
            teamTag,
            captainName,
            captainPhone,
            captainEmail,
            logoUrl,
            players,
            upiTransactionId,
            screenshotPreview,
          })
        );
      }
    } catch {
      // ignore
    }
  }, [
    step,
    selectedGame,
    selectedMode,
    teamName,
    teamTag,
    captainName,
    captainPhone,
    captainEmail,
    logoUrl,
    players,
    upiTransactionId,
    screenshotPreview,
  ]);

  async function handleSubmit() {
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      setError('Request timed out. Check your internet and try again.');
    }, 30000);

    try {
      if (!teamName.trim()) throw new Error('Team name is required');
      if (!captainName.trim()) throw new Error('Captain name is required');
      if (!/^\d{10}$/.test(captainPhone.replace(/\D/g, ''))) {
        throw new Error('Phone must be 10 digits');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail)) {
        throw new Error('Enter a valid email');
      }
      if (selectedMode === 'CS' && (!teamTag || teamTag.trim().length < 2)) {
        throw new Error('Team Tag (2-4 letters) is required for Clash Squad');
      }
      if (!upiTransactionId || upiTransactionId.trim().length < 10) {
        throw new Error('UTR must be at least 10 characters');
      }
      if (!screenshotFile && !screenshotPreview) {
        throw new Error('Please upload a payment screenshot');
      }
      if (!agreedToRules) {
        throw new Error('Please agree to the tournament rules');
      }

      console.log('[Register] Validation passed for mode:', selectedMode);

      let screenshotBase64 = screenshotPreview;
      if (screenshotFile) {
        screenshotBase64 = await fileToBase64(screenshotFile);
      }

      const registrationData = {
        game: selectedGame,
        mode: selectedMode,
        tournamentId:
          tournamentId || `${selectedGame.toLowerCase().replace(/\s+/g, '-')}-${selectedMode.toLowerCase()}-s1`,
        teamName: teamName.trim(),
        teamTag: teamTag ? teamTag.trim().toUpperCase() : undefined,
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        captainEmail: captainEmail.trim().toLowerCase(),
        players: players
          .filter((p) => p.uid?.trim() && p.ign?.trim())
          .map((p) => ({
            uid: p.uid.trim(),
            name: p.name?.trim() || p.ign.trim(),
            ign: p.ign.trim(),
            email: p.email?.trim() || captainEmail.trim().toLowerCase(),
          })),
        logoUrl: logoUrl || undefined,
        status: 'pending' as const,
        paymentStatus: 'pending_verification' as const,
        upiTransactionId: upiTransactionId.trim().toUpperCase(),
        paymentScreenshotUrl: screenshotBase64,
        registrationFeePaid: registrationFee,
        submittedAt: new Date().toISOString(),
      };

      console.log('[Register] Saving registration to Firestore:', registrationData);

      const regId = await createRegistration(registrationData);

      console.log('[Register] Success! Registration ID:', regId);

      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}

      clearTimeout(timeoutId);
      setSubmitting(false);
      setRegistrationId(regId);
      setStep(6);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : 'Registration failed';
      console.error('[Register] Error:', err);
      setError(msg);
      setSubmitting(false);
    }
  }

  // Registration Deadline Screen
  if (countdown.isExpired && activeTournament?.registrationDeadline) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-lg mx-auto rounded-3xl border border-red-500/30 bg-black/70 backdrop-blur-2xl space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-red-400 font-['Teko',sans-serif] tracking-wider uppercase">
            🔒 Registration Closed
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            The registration deadline for this tournament was:{' '}
            <strong className="text-white block mt-1 font-mono text-sm sm:text-base">
              {formatDeadlineDateTime(activeTournament.registrationDeadline)}
            </strong>
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link to="/contact">
            <Button variant="primary" size="sm">
              Contact Organizer
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" size="sm">
              Return to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Countdown Banner */}
      {countdown.isNear && !countdown.isExpired && step < 6 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg shadow-amber-500/10 animate-pulse">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              ⏰ Registration closes in <strong>{countdown.formatted}</strong>!
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 shrink-0 hidden sm:inline font-bold">
            Limited Slots
          </span>
        </div>
      )}

      {/* Top Step Progress Bar */}
      {step < 6 && (
        <ProgressBar currentStep={step} isFreeFire={selectedGame === 'Free Fire'} />
      )}

      {/* Animated Step Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {step === 1 && (
            <Step1GameSelect
              selectedGame={selectedGame}
              onSelectGame={(g) => {
                setSelectedGame(g);
                setCurrentGame(g);
                if (g === 'BGMI') {
                  setSelectedMode('BR');
                  setCurrentMode('BR');
                  setStep(3); // Skip format selection for BGMI
                } else {
                  setStep(2); // Go to format selection for Free Fire
                }
              }}
              onNext={() => {
                if (selectedGame === 'Free Fire') {
                  setStep(2);
                } else {
                  setSelectedMode('BR');
                  setCurrentMode('BR');
                  setStep(3);
                }
              }}
            />
          )}

          {step === 2 && (
            <ModeSelectionStep
              selectedMode={selectedMode}
              onSelectMode={(m) => {
                setSelectedMode(m);
                setCurrentMode(m);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <Step2TeamDetails
              selectedGame={selectedGame}
              selectedMode={selectedMode}
              teamName={teamName}
              setTeamName={setTeamName}
              teamTag={teamTag}
              setTeamTag={setTeamTag}
              captainName={captainName}
              setCaptainName={setCaptainName}
              captainPhone={captainPhone}
              setCaptainPhone={setCaptainPhone}
              captainEmail={captainEmail}
              setCaptainEmail={setCaptainEmail}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              onChangeGame={() => setStep(1)}
              onBack={() => {
                if (selectedGame === 'Free Fire') {
                  setStep(2);
                } else {
                  setStep(1);
                }
              }}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <Step3Roster
              selectedGame={selectedGame}
              selectedMode={selectedMode}
              teamName={teamName}
              teamTag={teamTag}
              captainEmail={captainEmail}
              players={players}
              setPlayers={setPlayers}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <Step4Payment
              paymentConfig={paymentConfig}
              registrationFee={registrationFee}
              upiTransactionId={upiTransactionId}
              setUpiTransactionId={setUpiTransactionId}
              screenshotFile={screenshotFile}
              setScreenshotFile={setScreenshotFile}
              screenshotPreview={screenshotPreview}
              setScreenshotPreview={setScreenshotPreview}
              agreedToRules={agreedToRules}
              setAgreedToRules={setAgreedToRules}
              agreedToNoRematch={agreedToNoRematch}
              setAgreedToNoRematch={setAgreedToNoRematch}
              isSubmitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={() => setStep(4)}
            />
          )}

          {step === 6 && (
            <Step5Success
              teamName={teamName}
              registrationId={registrationId}
              captainEmail={captainEmail}
              game={selectedGame}
              mode={selectedMode}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
