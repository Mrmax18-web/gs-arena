import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings,
  Shield,
  Trophy,
  CreditCard,
  QrCode,
  Upload,
  Check,
  AlertTriangle,
  Calendar,
  Clock,
  Timer,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTournament } from '../context/TournamentContext';
import { usePaymentConfig } from '../hooks/usePaymentConfig';
import { updateTournament } from '../lib/firestore';
import { formatDeadlineDateTime, isRegistrationExpired } from '../lib/deadline';
import { useCountdown } from '../hooks/useCountdown';
import type { LayoutContextType } from '../components/layout/Layout';

export function AdminSettingsPage() {
  const context = useOutletContext<LayoutContextType>();
  const game = context?.game || 'BGMI';
  const { activeTournament } = useTournament();

  // Registration Deadline State
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const countdown = useCountdown(activeTournament?.registrationDeadline);

  useEffect(() => {
    if (activeTournament?.registrationDeadline) {
      const d = new Date(activeTournament.registrationDeadline);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setDeadlineDate(`${year}-${month}-${day}`);
        setDeadlineTime(`${hours}:${minutes}`);
      }
    } else {
      setDeadlineDate('');
      setDeadlineTime('23:59');
    }
  }, [activeTournament?.registrationDeadline]);

  // Payment configuration
  const { config: paymentConfig, saveConfig: savePaymentConfigSetting } = usePaymentConfig();
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [feeBR, setFeeBR] = useState<number>(100);
  const [feeCS, setFeeCS] = useState<number>(150);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (paymentConfig) {
      setUpiId(paymentConfig.upiId || '');
      setPayeeName(paymentConfig.payeeName || '');
      setFeeBR(paymentConfig.registrationFeeBR ?? 100);
      setFeeCS(paymentConfig.registrationFeeCS ?? 150);
      setQrImageUrl(paymentConfig.qrImageUrl || '');
      setInstructions(paymentConfig.instructions || '');
    }
  }, [paymentConfig]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorBanner('QR image must be smaller than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setQrImageUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!upiId.trim() || !upiId.includes('@')) {
      setErrorBanner('Please enter a valid UPI ID (e.g. name@paytm, name@okhdfcbank)');
      return;
    }

    setIsSaving(true);
    try {
      await savePaymentConfigSetting({
        upiId: upiId.trim(),
        payeeName: payeeName.trim() || 'Tournament Organizer',
        registrationFeeBR: Number(feeBR) || 100,
        registrationFeeCS: Number(feeCS) || 150,
        qrImageUrl: qrImageUrl.trim(),
        instructions: instructions.trim(),
      });
      setSuccessBanner('Payment & UPI settings saved successfully!');
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament) {
      setErrorBanner('No active tournament selected');
      return;
    }
    if (!deadlineDate) {
      setErrorBanner('Please select a deadline date');
      return;
    }

    setIsSavingDeadline(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hours, minutes] = (deadlineTime || '23:59').split(':').map(Number);
      const deadlineObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

      const iso = deadlineObj.toISOString();
      const isExpired = Date.now() > deadlineObj.getTime();

      await updateTournament(activeTournament.id, {
        registrationDeadline: iso,
        registrationOpen: !isExpired,
      });

      setSuccessBanner(`✅ Registration deadline saved: ${deadlineObj.toLocaleString('en-IN')}`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to save deadline');
    } finally {
      setIsSavingDeadline(false);
    }
  };

  const handleClearDeadline = async () => {
    if (!activeTournament) return;
    setIsSavingDeadline(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      await updateTournament(activeTournament.id, {
        registrationDeadline: undefined,
        registrationOpen: true,
      });
      setDeadlineDate('');
      setDeadlineTime('23:59');
      setSuccessBanner('✅ Registration deadline cleared. Registration is now open indefinitely.');
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to clear deadline');
    } finally {
      setIsSavingDeadline(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {game}
            </span>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif] text-4xl">
            <Settings className="w-8 h-8 text-purple-400" />
            Admin Tournament Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tournament lifecycle parameters, scoring rules, registration deadlines, and payment gateway configurations.
          </p>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* FEATURE 1: Registration Deadline Configuration Card */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              📅 Registration Deadline
            </h2>
          </div>
          <div>
            {activeTournament?.registrationDeadline ? (
              countdown.isExpired ? (
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  🔒 Registration Closed
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Closes in {countdown.formatted}</span>
                </span>
              )
            ) : (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Open Indefinitely (No Deadline)
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Set a strict deadline for team applications. Once the deadline passes, the public <code>/register</code> portal automatically shuts down. Existing pending squads can still be reviewed by admins.
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Current Setting:</span>
            <span className="font-mono font-bold text-white">
              {formatDeadlineDateTime(activeTournament?.registrationDeadline)}
            </span>
          </div>
          {activeTournament?.registrationDeadline && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-gray-400">Time Remaining:</span>
              <span className="font-mono text-amber-300 font-bold">
                {countdown.isExpired ? 'Deadline Passed' : countdown.formatted}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveDeadline} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Deadline Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 focus:border-amber-500 focus:bg-white/[0.08] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Deadline Time (24h) <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 focus:border-amber-500 focus:bg-white/[0.08] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            {activeTournament?.registrationDeadline && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSavingDeadline}
                onClick={handleClearDeadline}
                className="text-xs text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Clear Deadline</span>
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingDeadline || !deadlineDate}
              className="text-xs h-9 px-6 bg-amber-600 hover:bg-amber-500 border-amber-500"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>{isSavingDeadline ? 'Saving Deadline...' : 'Save Deadline'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Payment Configuration Card */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              💰 Registration Fee & UPI Payment Gateway
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {upiId ? 'Active Gateway' : 'Unconfigured'}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Set up the official UPI ID, payee organization name, squad entry fees, and QR code image shown on the public registration payment screen.
        </p>

        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Official UPI ID / VPA <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="e.g. gsarena@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Payee / Organization Name
              </label>
              <Input
                placeholder="e.g. GS Arena Management"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Battle Royale (BR) Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={feeBR}
                onChange={(e) => setFeeBR(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Clash Squad (CS) Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={feeCS}
                onChange={(e) => setFeeCS(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              UPI QR Code Image
            </span>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-24 h-24 rounded-xl bg-white p-2 shrink-0 flex items-center justify-center border border-white/20">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="QR Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-500">
                    <QrCode className="w-8 h-8 mx-auto text-gray-400" />
                    <span className="text-[8px] block font-mono">Auto QR</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <Input
                  placeholder="Paste QR image URL (or upload image below)"
                  value={qrImageUrl}
                  onChange={(e) => setQrImageUrl(e.target.value)}
                  className="text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                  {qrImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrImageUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-gray-400 block">
              Payment Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Include team name in remarks..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/[0.08]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              className="text-xs h-9 px-6"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Payment Settings'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Tournament Containers & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base">Active Tournament Container</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Tournament Name</span>
              <span className="font-bold text-white">{activeTournament?.name || `${game} Championship`}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Selected Arena</span>
              <span className="font-bold text-white">{game}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Status</span>
              <span className="font-bold text-emerald-400">{activeTournament?.status || 'Open'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Mode</span>
              <span className="font-bold text-orange-400">{activeTournament?.mode || (game === 'Free Fire' ? 'CS' : 'BR')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Rules & Scoring System</h2>
          </div>
          <div className="space-y-2 text-xs text-gray-300">
            <p>
              • <strong>Kill Points:</strong> 1 Point per kill in classic Battle Royale matches.
            </p>
            <p>
              • <strong>Placement Points:</strong> 1st (WWCD): 15 pts, 2nd: 12 pts, 3rd: 10 pts, 4th: 8 pts, 5th: 6 pts.
            </p>
            <p>
              • <strong>Clash Squad:</strong> Best of 7 rounds (first to 4 wins secures match victory).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
