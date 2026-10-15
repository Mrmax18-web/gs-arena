import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react';
import { useCreator } from '../../hooks/useCreator';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

export interface CreatorPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const CREATOR_LOCKOUT_KEY = 'ttp_creator_lockout';

export function CreatorPasswordModal({ open, onClose }: CreatorPasswordModalProps) {
  const navigate = useNavigate();
  const { config, unlock, refreshConfig } = useCreator();
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setPasswordInput('');
      setErrorMessage(null);
      const lockoutTime = localStorage.getItem(CREATOR_LOCKOUT_KEY);
      if (lockoutTime) {
        const remaining = parseInt(lockoutTime, 10) - Date.now();
        if (remaining > 0) {
          setLockoutMinutes(Math.ceil(remaining / 60000));
        } else {
          localStorage.removeItem(CREATOR_LOCKOUT_KEY);
          setLockoutMinutes(0);
          setAttempts(0);
        }
      }
    }
  }, [open, config]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutMinutes > 0 || cooldown || isSubmitting || !passwordInput) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const success = await unlock(passwordInput);
    if (success) {
      setAttempts(0);
      setPasswordInput('');
      onClose();
      navigate('/creator');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
      if (next >= 3) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(CREATOR_LOCKOUT_KEY, String(lockoutUntil));
        setLockoutMinutes(15);
        setErrorMessage('3 failed attempts. Security lockout active for 15 minutes.');
      } else {
        setErrorMessage(`Invalid code. ${3 - next} attempt(s) remaining.`);
      }
    }
    setIsSubmitting(false);
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await refreshConfig();
      setIsOffline(!navigator.onLine);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Restricted Access">
      <div
        className={cn(
          'space-y-4 pt-1',
          shake && 'animate-[modal-shake_0.5s_ease-in-out]'
        )}
      >
        <style>{`
          @keyframes modal-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {(isOffline || !config) && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Offline - some features may be unavailable</span>
            </div>
            <button
              type="button"
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {lockoutMinutes > 0 ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="font-bold text-sm">Security Lockout Active</p>
            <p className="text-xs text-gray-400">
              Too many invalid access attempts. Try again in {lockoutMinutes} minute(s).
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-xs text-gray-400">
              Enter your master creator passkey to access authorization controls.
            </p>
            <Input
              label="Access Code"
              type="password"
              placeholder="Enter master passkey..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              error={errorMessage || undefined}
              autoFocus
              autoComplete="off"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting || cooldown || !passwordInput}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{cooldown ? 'Wait 3s...' : isSubmitting ? 'Verifying...' : 'Enter'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
