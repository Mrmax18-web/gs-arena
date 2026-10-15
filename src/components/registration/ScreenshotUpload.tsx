import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, FileCheck } from 'lucide-react';

export interface ScreenshotUploadProps {
  value: string; // base64 or url
  onChange: (dataUrl: string) => void;
  onFileChange?: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function ScreenshotUpload({
  value,
  onChange,
  onFileChange,
  error,
  disabled,
}: ScreenshotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const processFile = (file: File) => {
    setLocalError(null);

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setLocalError('Invalid file type. Please upload a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setLocalError(`Screenshot is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    if (onFileChange) {
      onFileChange(file);
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result;
      if (typeof res === 'string') {
        onChange(res);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setLocalError('Failed to read image file. Please try again.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onFileChange) onFileChange(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Payment Confirmation Screenshot
        </label>
        <span className="text-xs text-slate-400">Max 5MB (PNG, JPG, WEBP)</span>
      </div>

      {value ? (
        /* Preview Card */
        <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/60 p-2 shadow-lg">
          <div className="relative max-h-56 w-full flex items-center justify-center bg-black/90 rounded-xl overflow-hidden">
            <img
              src={value}
              alt="Payment Screenshot Receipt"
              className="max-h-56 w-auto object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-rose-600/90 text-xs font-semibold text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-emerald-400">
            <FileCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Screenshot uploaded and ready</span>
          </div>
        </div>
      ) : (
        /* Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-[1.01]'
              : 'border-white/20 bg-white/[0.03] hover:border-orange-500/50 hover:bg-white/[0.06]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 mb-2">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-200">
            {isProcessing ? 'Processing screenshot...' : 'Click to upload or drag & drop'}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">
            Attach Google Pay, PhonePe, or Paytm receipt confirmation
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={disabled}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {(error || localError) && (
        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || localError}</span>
        </p>
      )}
    </div>
  );
}
