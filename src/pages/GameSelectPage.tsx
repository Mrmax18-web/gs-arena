import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { PeekingCardList } from '../components/ui/PeekingCardList';
import { useToast } from '../components/ui/Toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AdminApplicationSchema } from '../lib/validators';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { systemConfigConverter } from '../lib/converters';
import { SystemConfig } from '../types/config';

export const GameSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { setGameId } = useGame();
  const { user, role, signIn, applyForAdmin } = useAuth();
  const { success, error } = useToast();

  const { data: systemConfig } = useFirestoreDoc<SystemConfig>(
    'config/system',
    systemConfigConverter
  );
  const appearance = systemConfig?.appearance;
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  const [ffExpanded, setFfExpanded] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'signin' | 'reset' | 'apply'>('signin');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apply form state
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [applyContact, setApplyContact] = useState('');

  const handleSelectBgmi = () => {
    setGameId('BGMI');
    navigate('/leaderboard');
  };

  const handleSelectFfBr = () => {
    setGameId('FF_BR');
    navigate('/leaderboard');
  };

  const handleSelectFfCs = () => {
    setGameId('FF_CS');
    navigate('/leaderboard');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Required Fields', 'Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      success('Signed In', 'Welcome back to GS Arena.');
      setLoginModalOpen(false);
      navigate('/leaderboard');
    } catch (err: any) {
      error('Authentication Failed', err?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Email Required', 'Please enter your email to send a reset link.');
      return;
    }
    setSubmitting(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        success('Reset Email Dispatched', 'Check your inbox for password reset instructions.');
        setModalTab('signin');
      } else {
        error('Auth Not Configured', 'Firebase Auth service is not ready.');
      }
    } catch (err: any) {
      error('Reset Failed', err?.message || 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const parseResult = AdminApplicationSchema.safeParse({
      name: applyName,
      email: applyEmail,
      reason: applyReason,
      contact: applyContact,
    });

    if (!parseResult.success) {
      error('Validation Error', parseResult.error.errors[0]?.message || 'Invalid form data.');
      return;
    }

    if (!user) {
      error('Account Required', 'Please sign in or register before applying for Admin permissions.');
      setModalTab('signin');
      return;
    }

    setSubmitting(true);
    try {
      await applyForAdmin(parseResult.data);
      success('Application Submitted', 'Your request is pending Creator approval.');
      setLoginModalOpen(false);
      setModalTab('signin');
    } catch (err: any) {
      error('Submission Error', err?.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 md:p-8">
      {/* Top Header with Brand and Admin Login */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {appearance?.arenaLogoUrl && !imageErrors['arenaLogo'] ? (
            <img
              src={appearance.arenaLogoUrl}
              alt="GS Arena"
              onError={() => handleImageError('arenaLogo')}
              className="h-11 w-11 object-contain rounded-2xl shadow-lg"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 font-black text-xl">
              GS
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              GS <span className="text-brand-500">ARENA</span>
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Official Competitive Arena
            </p>
          </div>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Signed in as <span className="text-brand-500">{role}</span>
              </span>
              <Button
                variant="glass"
                size="sm"
                icon="solar:arrow-right-line-duotone"
                onClick={() => navigate('/leaderboard')}
              >
                Enter Platform
              </Button>
            </div>
          ) : (
            <Button
              variant="glass"
              size="sm"
              icon="solar:shield-user-bold"
              onClick={() => {
                setModalTab('signin');
                setLoginModalOpen(true);
              }}
            >
              Admin Access
            </Button>
          )}
        </div>
      </div>

      {/* Main Center Title & Game Selection Cards */}
      <div className="my-auto py-10 max-w-5xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 space-y-3"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Icon icon="solar:gamepad-bold" /> Select Your Battleground
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Choose Tournament Title
          </h2>
          <p className="text-sm max-w-xl mx-auto text-slate-600 dark:text-slate-400">
            Real-time live leaderboards, automated scoring snapshots, individual player MVP calculations, and tournament ops.
          </p>
        </motion.div>

        {/* The Two Massive Glass Cards */}
        <PeekingCardList ariaLabel="Tournament Battleground Titles" gapPx={24} className="items-start">
          {/* Card 1: BGMI */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={handleSelectBgmi}
          >
            <GlassCard
              strong
              className="relative overflow-hidden group text-left p-8 border-slate-200 dark:border-white/10 hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300 shadow-lg overflow-hidden p-1.5">
                  {appearance?.bgmiIconUrl && !imageErrors['bgmi'] ? (
                    <img
                      src={appearance.bgmiIconUrl}
                      alt="BGMI"
                      onError={() => handleImageError('bgmi')}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Icon icon="solar:fire-bold" className="text-3xl" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Battle Royale
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-500 transition-colors">
                BGMI
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Battlegrounds Mobile India
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                Official 16-team lobbies. BGIS scoring standard (10-point 1st place scale), live MVP impact formulas, and real-time kills tracking.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">
                <span>Enter BGMI Arena</span>
                <Icon icon="solar:arrow-right-line-duotone" className="text-lg" />
              </div>
            </GlassCard>
          </motion.div>

          {/* Card 2: Free Fire (Expands on Click) */}
          <motion.div layout transition={{ duration: 0.3 }}>
            <GlassCard
              strong
              onClick={() => {
                if (!ffExpanded) setFfExpanded(true);
              }}
              className={`relative overflow-hidden group text-left p-8 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 ${!ffExpanded ? 'cursor-pointer' : ''}`}
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-lg overflow-hidden p-1.5">
                  {appearance?.ffIconUrl && !imageErrors['ff'] ? (
                    <img
                      src={appearance.ffIconUrl}
                      alt="Free Fire"
                      onError={() => handleImageError('ff')}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Icon icon="solar:shield-star-bold" className="text-3xl" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Multiple Modes
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-500 transition-colors">
                Free Fire
              </h3>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Battle Royale & Clash Squad
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                Esports competitive modes. 12-point Battle Royale ladder or intense 4v4 Clash Squad round difference leaderboards.
              </p>

              {!ffExpanded ? (
                <Button
                  variant="glass"
                  className="mt-6 w-full justify-between"
                  icon="solar:maximize-square-minimalistic-bold"
                  onClick={() => setFfExpanded(true)}
                >
                  <span>Select Game Mode</span>
                  <Icon icon="solar:alt-arrow-down-bold" />
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3 pt-4 border-t border-slate-200 dark:border-white/10"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Choose Mode:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleSelectFfBr}
                        className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 p-4 text-left transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <div className="flex items-center justify-between text-indigo-400 font-bold text-sm mb-1">
                          <span>BR Mode</span>
                          <Icon icon="solar:arrow-right-line-duotone" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          12-point placement + 1 pt kill scale
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectFfCs}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 p-4 text-left transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <div className="flex items-center justify-between text-emerald-400 font-bold text-sm mb-1">
                          <span>Clash Squad</span>
                          <Icon icon="solar:arrow-right-line-duotone" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          4v4 round-difference standings
                        </p>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFfExpanded(false)}
                      className="text-[11px] text-slate-400 hover:text-white underline pt-2 block"
                    >
                      Collapse options
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}
            </GlassCard>
          </motion.div>
        </PeekingCardList>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400">
        GS Arena &copy; {new Date().getFullYear()} &bull; Production Ready Esports Architecture
      </footer>


      {/* Admin Login & Apply Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title={
          modalTab === 'signin'
            ? 'Administrator Sign In'
            : modalTab === 'reset'
            ? 'Reset Password'
            : 'Apply for Administrator Role'
        }
        description={
          modalTab === 'signin'
            ? 'Sign in with your tournament operations account'
            : modalTab === 'reset'
            ? 'Enter your email to receive recovery instructions'
            : 'Submit an application for Creator approval'
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Tab buttons */}
          <div className="flex border-b border-slate-200 dark:border-white/10 pb-2 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalTab('signin')}
              className={`pb-1 transition-colors ${
                modalTab === 'signin'
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setModalTab('apply')}
              className={`pb-1 transition-colors ${
                modalTab === 'apply'
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Apply for Admin
            </button>
          </div>

          {modalTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@esports.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon="solar:letter-bold"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon="solar:lock-keyhole-bold"
                required
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab('reset')}
                  className="text-brand-500 hover:underline"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('apply')}
                  className="text-slate-400 hover:text-white"
                >
                  Need Admin access? Apply here
                </button>
              </div>
              <Button type="submit" variant="primary" loading={submitting} className="w-full">
                Sign In to Console
              </Button>
            </form>
          )}

          {modalTab === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                placeholder="you@esports.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon="solar:letter-bold"
                required
              />
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalTab('signin')}>
                  Back to Sign In
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}

          {modalTab === 'apply' && (
            <form onSubmit={handleApply} className="space-y-3">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={applyName}
                onChange={(e) => setApplyName(e.target.value)}
                required
              />
              <Input
                label="Account Email"
                type="email"
                placeholder="admin-candidate@esports.com"
                value={applyEmail}
                onChange={(e) => setApplyEmail(e.target.value)}
                required
              />
              <Input
                label="Discord Tag or Phone"
                placeholder="User#1234 or +1-555-0192"
                value={applyContact}
                onChange={(e) => setApplyContact(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Experience & Reason
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-black/20 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe your esports tournament referee or admin experience..."
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Note: You must be signed in with this account so your UID is linked.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalTab('signin')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Submit Application
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
