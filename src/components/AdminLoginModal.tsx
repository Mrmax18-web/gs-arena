import React, { useState } from 'react';
import { ShieldCheck, Mail, AlertCircle, LogIn, Globe, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
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
    return errorObj?.message || 'Authentication failed. Please try again.';
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
        setEmail('');
        setError(null);
        onClose();
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
      setEmail('');
      onClose();
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
    <Modal open={open} onClose={onClose} title="Administrator Sign In">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
          <ShieldCheck className="w-5 h-5 shrink-0 text-orange-400 mt-0.5" />
          <p className="leading-relaxed">
            Enter your authorized email address. If the tournament creator has added your email to the administrator roster, you will instantly gain access.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>

            {error.includes('unauthorized-domain') && (
              <div className="mt-3 pt-2.5 border-t border-rose-500/20 space-y-2">
                <p className="text-xs text-slate-300">
                  Domain to add:{' '}
                  <code className="bg-black/50 px-2 py-0.5 rounded font-mono text-amber-300 font-bold">
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
              Only emails pre-approved by the tournament creator in the Creator Console can access admin pages.
            </p>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={loading}
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Verifying Authorization...' : 'Sign In as Administrator'}</span>
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-white/10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Or Sign in with Authorized Google Account</span>
          </button>
          <span className="text-[11px] text-gray-500 text-center">
            Need admin access? Request the tournament creator to add your email in the Creator Console.
          </span>
        </div>
      </div>
    </Modal>
  );
}
