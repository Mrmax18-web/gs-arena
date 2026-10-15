import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  Upload,
  X,
  FileCheck,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { fileToBase64 } from '../../lib/fileUtils';
import type { PaymentConfig } from '../../lib/creator';

export interface Step4PaymentProps {
  paymentConfig: PaymentConfig | null;
  registrationFee: number;
  upiTransactionId: string;
  setUpiTransactionId: (val: string) => void;
  screenshotFile: File | null;
  setScreenshotFile: (file: File | null) => void;
  screenshotPreview: string;
  setScreenshotPreview: (url: string) => void;
  agreedToRules: boolean;
  setAgreedToRules: (val: boolean) => void;
  agreedToNoRematch?: boolean;
  setAgreedToNoRematch?: (val: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

export function Step4Payment({
  paymentConfig,
  registrationFee,
  upiTransactionId,
  setUpiTransactionId,
  screenshotFile,
  setScreenshotFile,
  screenshotPreview,
  setScreenshotPreview,
  agreedToRules,
  setAgreedToRules,
  agreedToNoRematch = false,
  setAgreedToNoRematch,
  isSubmitting,
  error,
  onSubmit,
  onBack,
}: Step4PaymentProps) {
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanUpi = paymentConfig?.upiId?.trim() || 'esports.tournaments@upi';
  const payee = paymentConfig?.payeeName || 'Tournament Organizer';

  // QR Code generator
  const qrImage =
    paymentConfig?.qrImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cleanUpi)}&margin=8`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Payment screenshot must be under 5 MB');
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setScreenshotPreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormReady =
    upiTransactionId.trim().length >= 10 &&
    (Boolean(screenshotFile) || Boolean(screenshotPreview)) &&
    agreedToRules &&
    agreedToNoRematch;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider block">
            Step 4 of 4
          </span>
          <h2 className="text-3xl font-black font-['Teko',sans-serif] uppercase tracking-wide text-white">
            Payment & Verification
          </h2>
        </div>

        {/* Fee Badge */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-emerald-400">
            Entry Fee:{' '}
            <strong className="text-emerald-300 font-mono text-base font-bold">
              ₹{registrationFee}
            </strong>
          </span>
        </div>
      </div>

      <Card className="p-6 space-y-6 bg-black/40 border border-white/10">
        {/* PAYMENT CARD WITH QR CODE & COPY BUTTON */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-black/60 border border-white/10">
          <div className="shrink-0 w-36 h-36 rounded-xl bg-white p-2 shadow-lg flex items-center justify-center">
            <img
              src={qrImage}
              alt="UPI QR Code"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block font-mono">
                Official Tournament UPI
              </span>
              <h3 className="text-xl font-black text-white font-['Teko',sans-serif] text-2xl tracking-wide leading-tight">
                {payee}
              </h3>
            </div>

            {/* UPI ID with copy button */}
            <div className="inline-flex items-center gap-2 max-w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <code className="text-xs sm:text-sm font-mono font-bold text-amber-300 truncate select-all">
                {cleanUpi}
              </code>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy UPI ID"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold font-sans">
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white font-sans">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </span>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Registration Fee:{' '}
              <strong className="text-white font-mono text-sm font-bold">
                ₹{registrationFee}
              </strong>{' '}
              per squad.
            </p>
          </div>
        </div>

        {/* HOW TO PAY STEP BY STEP */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
          <span className="font-bold text-gray-300 uppercase tracking-wider block font-mono text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            📋 How to Pay:
          </span>
          <ol className="space-y-1.5 text-gray-400 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
            <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM)</li>
            <li>Scan the QR code above or enter the UPI ID</li>
            <li>Pay <strong>₹{registrationFee}</strong> to the UPI ID shown</li>
            <li>Take a screenshot of the confirmation</li>
            <li>Paste the 12-digit UTR below</li>
            <li>Upload the screenshot</li>
            <li>Click Submit Registration</li>
          </ol>
        </div>

        {/* UTR INPUT */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block">
            UTR Number <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 425348648634"
            maxLength={16}
            value={upiTransactionId}
            onChange={(e) =>
              setUpiTransactionId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
            }
            className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono tracking-wider text-sm outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
          />
          <p className="text-[11px] text-gray-500">
            12-16 alphanumeric characters found under "UPI Ref No" or "Transaction ID".
          </p>
        </div>

        {/* SCREENSHOT UPLOAD */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block">
            Payment Screenshot <span className="text-rose-400">*</span>
          </label>

          {screenshotPreview ? (
            <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/60 p-2 shadow-lg">
              <div className="relative max-h-56 w-full flex items-center justify-center bg-black/90 rounded-xl overflow-hidden">
                <img
                  src={screenshotPreview}
                  alt="Receipt Preview"
                  className="max-h-56 w-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-rose-600/90 text-xs font-semibold text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Screenshot attached and ready</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-orange-500/50 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center"
            >
              <Upload className="w-8 h-8 text-orange-400 mb-2" />
              <span className="text-xs font-semibold text-gray-200">
                Click to upload payment receipt
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                PNG or JPEG, max 5 MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
          {localError && <p className="text-xs text-rose-400">{localError}</p>}
        </div>

        {/* RULES AGREEMENT CHECKBOX */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.06] transition-colors">
          <input
            type="checkbox"
            checked={agreedToRules}
            onChange={(e) => setAgreedToRules(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-orange-500 cursor-pointer"
          />
          <span className="text-xs text-gray-300 leading-relaxed select-none">
            I agree to the tournament official rules, anti-cheat policy, and confirm all entered UTR and roster information is accurate.
          </span>
        </label>

        {/* FEATURE 4: NO REMATCH POLICY CHECKBOX */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/25 cursor-pointer hover:bg-amber-500/[0.08] transition-colors">
          <input
            type="checkbox"
            checked={agreedToNoRematch}
            onChange={(e) => setAgreedToNoRematch?.(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-amber-200 leading-relaxed select-none">
            <strong>No Rematch Policy:</strong> I understand that missing teammates at match time does NOT qualify for a rematch. All squads must drop with available players or forfeit.
          </span>
        </label>
      </Card>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="text-red-400 text-xs sm:text-sm p-4 bg-red-500/10 rounded-2xl border border-red-500/30 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">❌ {error}</span>
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto h-11 px-6 text-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </Button>

        {isSubmitting ? (
          <Button
            type="button"
            variant="primary"
            disabled
            className="w-full sm:w-auto h-11 px-8 text-xs font-bold"
          >
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>⏳ Processing...</span>
          </Button>
        ) : error ? (
          <Button
            type="button"
            variant="danger"
            onClick={onSubmit}
            className="w-full sm:w-auto h-11 px-8 text-xs font-bold cursor-pointer"
          >
            <span>❌ Try Again</span>
          </Button>
        ) : !isFormReady ? (
          <Button
            type="button"
            variant="secondary"
            disabled
            className="w-full sm:w-auto h-11 px-8 text-xs font-semibold opacity-60 cursor-not-allowed"
          >
            <span>Complete all fields</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            className="w-full sm:w-auto h-11 px-8 text-xs font-bold cursor-pointer hover:scale-[1.01] transition-transform"
          >
            <span>📤 Submit Registration</span>
            <CheckCircle2 className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
