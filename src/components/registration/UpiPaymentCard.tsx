import React, { useState } from 'react';
import { Copy, Check, QrCode, Info } from 'lucide-react';

export interface UpiPaymentCardProps {
  upiId: string;
  payeeName: string;
  fee: number;
  qrImageUrl?: string;
  instructions?: string;
}

export function UpiPaymentCard({
  upiId,
  payeeName,
  fee,
  qrImageUrl,
  instructions,
}: UpiPaymentCardProps) {
  const [copied, setCopied] = useState(false);

  // Standard UPI QR code generator
  const cleanUpi = upiId.trim();
  const dynamicQrCode =
    qrImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cleanUpi)}&margin=8`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: QR Code + Official UPI Details */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-black/50 border border-white/10 shadow-lg">
        {/* QR Code */}
        <div className="shrink-0 w-36 h-36 rounded-xl bg-white p-2 shadow-md flex items-center justify-center">
          <img
            src={dynamicQrCode}
            alt="UPI QR Code"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Receiver Details */}
        <div className="flex-1 text-center sm:text-left space-y-3 w-full">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block mb-0.5 font-mono">
              OFFICIAL TOURNAMENT UPI
            </span>
            <h3 className="text-xl font-black text-white font-['Teko',sans-serif] text-2xl tracking-wide leading-tight">
              {payeeName || 'Tournament Management'}
            </h3>
          </div>

          {/* Copyable UPI Box */}
          <div className="inline-flex items-center gap-2 max-w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
            <code className="text-xs sm:text-sm font-mono font-bold text-amber-300 truncate select-all">
              {cleanUpi}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Copy UPI ID"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-bold">
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white font-sans font-medium">
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </span>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Registration Fee:{' '}
            <strong className="text-white font-mono text-sm font-bold">₹{fee}</strong> per squad.
          </p>
        </div>
      </div>

      {/* Numbered Step-by-Step Payment Instructions */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
        <span className="font-bold text-gray-300 uppercase tracking-wider block font-mono text-[11px] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          📋 HOW TO PAY
        </span>
        <ol className="space-y-1.5 text-gray-400 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
          <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM)</li>
          <li>Scan the QR code above or enter the UPI ID</li>
          <li>Pay <strong>₹{fee}</strong> to the UPI ID</li>
          <li>Take a screenshot of the payment confirmation</li>
          <li>Paste the 12-digit UTR number below</li>
          <li>Upload the screenshot</li>
          <li>Click "Submit Registration"</li>
        </ol>

        {instructions && instructions.trim() && (
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-400 italic">
            "{instructions}"
          </div>
        )}
      </div>
    </div>
  );
}
