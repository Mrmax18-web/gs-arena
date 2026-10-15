import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  AlertCircle,
  LogIn,
  Globe,
  ArrowLeft,
  Copy,
  Check,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CosmicBackground } from '../components/CosmicBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function AdminAuthPage() {
  const navigate = useNavigate();
  const { signInWithAdminEmail, signInWithGoogleOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const formatAuthError = (err: unknown): string => {
    const errorObj = err as any;
    if (
      errorObj?.code === 'auth/unauthorized-domain' ||
      (typeof errorObj?.message === 'string' && errorObj.message.includes('auth/unauthorized-domain'))
    ) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current-domain';
      return (
        'This domain is not authorized in Firebase. ' +
        'Please add ' + hostname + ' to ' +
        'Firebase Console → Authentication → Settings → ' +
        'Authorized Domains.'
      );
    }
    return errorObj?.message || 'Authentication failed. Please check your credentials.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithAdminEmail(clean);
      if (result.success) {
        navigate('/approvals');
      } else {
        setError(result.error || 'Access denied for this email address.');
      }
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogleOAuth();
      navigate('/approvals');
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col items-center justify-center p-4">
      <CosmicBackground />

      {/* Top Bar back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Arena</span>
        </Link>
      </div>

      <Card className="relative z-10 w-full max-w-md p-6 sm:p-8 border border-white/15 bg-black/75 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-2xl blur-md opacity-60" />
            <img
              src="/gs-arena-logo.png"
              alt="GS Arena"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fb = (e.target as HTMLElement).parentElement?.querySelector('.admin-logo-fb') as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
              className="relative w-14 h-14 rounded-2xl object-contain bg-black/60 p-1 border border-orange-500/30"
            />
            <div className="admin-logo-fb hidden w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 items-center justify-center text-white font-black text-sm">
              GS
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Teko',sans-serif] tracking-wider leading-none">
            ADMINISTRATOR SIGN IN
          </h1>
          <p className="text-xs text-amber-400 font-mono">
            GS Arena Operations Console
          </p>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs">
          <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            Authorized administrator credentials required. Only email addresses pre-approved by the tournament creator can manage registrations and match results.
          </p>
        </div>

        {/* Error Notice with unauthorized-domain guidance and Copy Domain button */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>

            {error.includes('unauthorized-domain') && (
              <div className="mt-3 pt-3 border-t border-rose-500/30 space-y-2">
                <p className="text-xs text-slate-300">
                  Domain to add in Firebase Console:{' '}
                  <code className="bg-black/60 px-2 py-0.5 rounded font-mono text-amber-300 font-bold">
                    {hostname}
                  </code>
                </p>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="text-xs px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-200 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Domain!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Copy Domain</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Administrator Email ID
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="e.g. admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/[0.08]"
                autoFocus
              />
              <Mail className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400">
              Enter your pre-registered administrative email ID.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full h-10 text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            disabled={loading}
          >
            <LogIn className="w-4 h-4 mr-2" />
            <span>{loading ? 'Verifying Authorization...' : 'Sign In as Administrator'}</span>
          </Button>
        </form>

        <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Sign In with Authorized Google Account</span>
          </button>

          <Link
            to="/creator"
            className="text-[11px] text-amber-400/80 hover:text-amber-300 font-mono transition-colors"
          >
            Switch to Creator Passkey Console →
          </Link>
        </div>
      </Card>
    </div>
  );
}
