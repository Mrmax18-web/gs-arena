import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AdminApplicationSchema } from '../lib/validators';
import { CreatorLoginModal } from '../components/auth/CreatorLoginModal';
import { Icon } from '@iconify/react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, applyForAdmin } = useAuth();
  const { success, error } = useToast();

  const [tab, setModalTab] = useState<'signin' | 'signup' | 'reset' | 'apply'>('signin');
  const [secretDialogOpen, setSecretDialogOpen] = useState<boolean>(false);

  // Sign In / Up State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apply State
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [applyContact, setApplyContact] = useState('');

  const redirectTarget = (location.state as any)?.from?.pathname || '/leaderboard';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      success('Signed In', 'Welcome back.');
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      error('Sign In Failed', err?.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, displayName);
      success('Account Created', 'Your account has been registered.');
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      error('Sign Up Failed', err?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Email Required', 'Please enter your registered email address.');
      return;
    }
    setSubmitting(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        success('Reset Email Sent', 'Check your inbox for password reset instructions.');
        setModalTab('signin');
      } else {
        error('Auth Error', 'Authentication service unavailable.');
      }
    } catch (err: any) {
      error('Reset Error', err?.message || 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = AdminApplicationSchema.safeParse({
      name: applyName,
      email: applyEmail,
      reason: applyReason,
      contact: applyContact,
    });

    if (!parse.success) {
      error('Validation Failed', parse.error.errors[0]?.message);
      return;
    }

    if (!user) {
      error('Sign In Required', 'Please sign in or register before applying for Admin permissions.');
      setModalTab('signin');
      return;
    }

    setSubmitting(true);
    try {
      await applyForAdmin(parse.data);
      success('Application Submitted', 'Your referee request is pending Creator approval.');
      setModalTab('signin');
    } catch (err: any) {
      error('Application Error', err?.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[100vh] min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <GlassCard strong className="w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 shadow-2xl text-left border-slate-200 dark:border-white/10">
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 mb-3">
            <Icon icon="solar:shield-user-bold" className="text-3xl" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            GS Arena Operations Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access administrator features, referee scorekeeping, and creator controls
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-white/10 pb-3 mb-5 gap-2 sm:gap-3 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setModalTab('signin')}
            className={`pb-1 transition-colors min-h-[36px] flex items-center ${
              tab === 'signin' ? 'border-b-2 border-brand-500 text-brand-500 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setModalTab('signup')}
            className={`pb-1 transition-colors min-h-[36px] flex items-center ${
              tab === 'signup' ? 'border-b-2 border-brand-500 text-brand-500 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setModalTab('apply')}
            className={`pb-1 transition-colors min-h-[36px] flex items-center ${
              tab === 'apply' ? 'border-b-2 border-brand-500 text-brand-500 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Apply for Admin
          </button>
        </div>

        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              id="signin-email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@esports.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon="solar:letter-bold"
              required
            />
            <Input
              id="signin-password"
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon="solar:lock-keyhole-bold"
              required
            />
            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={() => setModalTab('reset')}
                className="text-brand-500 hover:underline py-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded"
              >
                Forgot password?
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="w-full min-h-[44px]"
            >
              Sign In
            </Button>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              id="signup-displayName"
              name="displayName"
              label="Display Name"
              type="text"
              autoComplete="name"
              placeholder="Referee Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              id="signup-email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@esports.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="signup-password"
              name="password"
              label="Password (min 6 characters)"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="w-full min-h-[44px]"
            >
              Create Account
            </Button>
          </form>
        )}

        {tab === 'reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <Input
              id="reset-email"
              name="email"
              label="Account Email"
              type="email"
              autoComplete="email"
              placeholder="you@esports.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalTab('signin')}
                className="min-h-[44px]"
              >
                Back to Sign In
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                className="min-h-[44px]"
              >
                Send Link
              </Button>
            </div>
          </form>
        )}

        {tab === 'apply' && (
          <form onSubmit={handleApply} className="space-y-3">
            <Input
              id="apply-name"
              name="name"
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={applyName}
              onChange={(e) => setApplyName(e.target.value)}
              required
            />
            <Input
              id="apply-email"
              name="email"
              label="Account Email"
              type="email"
              autoComplete="email"
              placeholder="admin@esports.com"
              value={applyEmail}
              onChange={(e) => setApplyEmail(e.target.value)}
              required
            />
            <Input
              id="apply-contact"
              name="contact"
              label="Discord Tag or Phone"
              type="text"
              placeholder="User#1234"
              value={applyContact}
              onChange={(e) => setApplyContact(e.target.value)}
              required
            />
            <div className="text-left space-y-1.5">
              <label
                htmlFor="apply-reason"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Reason & Esports Experience
              </label>
              <textarea
                id="apply-reason"
                name="reason"
                rows={3}
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                placeholder="Describe your tournament referee background..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-black/20 p-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="w-full min-h-[44px]"
            >
              Submit Application
            </Button>
          </form>
        )}

        {/* Subtle keyboard-accessible secret creator control */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>GS Arena Security</span>
          <button
            type="button"
            onClick={() => setSecretDialogOpen(true)}
            aria-label="Secret Creator Authorization"
            className="text-[11px] font-mono tracking-wide text-slate-400 hover:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus:outline-none rounded px-2.5 py-1.5 min-h-[32px] inline-flex items-center transition-colors opacity-70 hover:opacity-100"
          >
            Secret
          </button>
        </div>
      </GlassCard>

      {/* Accessible Secret Creator Modal Dialog */}
      <CreatorLoginModal
        isOpen={secretDialogOpen}
        onClose={() => setSecretDialogOpen(false)}
        onSuccess={() => navigate('/creator')}
      />
    </div>
  );
};

export default LoginPage;

