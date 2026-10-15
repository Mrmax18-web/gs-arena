import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Send,
  CheckCircle2,
  ArrowLeft,
  Mail,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAdminRequests } from '../hooks/useAdminRequests';
import { useToast } from '../context/ToastContext';

export function RequestAdminPage() {
  const { submitRequest } = useAdminRequests();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!reason.trim()) {
      setError('Please explain why you are requesting administrative access');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitRequest({
        name,
        email,
        reason,
      });

      setSubmitted(true);
      showToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'Your admin privileges application has been routed to the creator.',
        duration: 5000,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      setError(msg);
      showToast({
        type: 'warning',
        title: 'Submission Failed',
        message: msg,
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col justify-between py-12 px-4 sm:px-6">
      <CosmicBackground />

      <div className="relative z-10 max-w-lg w-full mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Arena</span>
          </Link>
          <Link
            to="/contact"
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
          >
            Contact & Support
          </Link>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 border border-amber-500/20 bg-[#090b14]/90 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              Request Admin Access
            </h1>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Apply for administrative credentials to manage teams, verify registrations, and record live match results.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Application Received!
                </h3>
                <p className="text-xs text-slate-300">
                  Your request has been logged. The master creator reviews all applications. Once approved, you will be able to sign in via Google with <strong className="text-white">{email}</strong>.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Back to Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Name</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Account Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
                <span className="text-[11px] text-slate-400 block">
                  Must be the exact email you use to sign in with Google Auth.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Role & Motivation</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Why do you want admin access? Describe your tournament management experience or role in the community..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || !name.trim() || !email.trim() || !reason.trim()}
                className="w-full flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Admin Application</span>
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-white/5">
            <span>Already an authorized admin? </span>
            <Link to="/login" className="text-amber-400 hover:underline font-semibold">
              Sign In Here
            </Link>
          </div>
        </Card>
      </div>

      <div className="relative z-10 text-center text-xs text-slate-500 pt-6">
        Protected by GS Arena Identity Verification • Creator Authorization Required
      </div>
    </div>
  );
}
