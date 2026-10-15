import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link2, X, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressImage, type ImageType, IMAGE_LIMITS } from '../../lib/imageUtils';

export interface ImageUploaderProps {
  label: string;
  description?: string;
  currentValue: string;
  onChange: (newValue: string) => void;
  imageType?: ImageType;
  maxSizeKB?: number;
  previewSize?: number;
  previewAspect?: 'square' | 'wide';
  accept?: string;
  defaultFallback?: string;
}

export function ImageUploader({
  label,
  description,
  currentValue,
  onChange,
  imageType = 'icon',
  maxSizeKB,
  previewSize = 64,
  previewAspect = 'square',
  accept = 'image/*',
  defaultFallback,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute allowed max size based on imageType or override
  const typeLimitKB = IMAGE_LIMITS[imageType]?.maxSizeKB || 200;
  const effectiveMaxKB = maxSizeKB || typeLimitKB;

  // Initialize compressed size if currentValue is base64
  useEffect(() => {
    if (currentValue && currentValue.startsWith('data:')) {
      const approxKB = Math.round((currentValue.length * 0.75) / 1024);
      setCompressedSize(approxKB);
    } else {
      setCompressedSize(null);
    }
  }, [currentValue]);

  const handleProcessFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Use aggressive compression tailored to image type
      const compressed = await compressImage(file, imageType);
      const sizeKB = Math.round((compressed.length * 0.75) / 1024);
      setCompressedSize(sizeKB);
      onChange(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset file input value so re-selecting same file triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const isWide = previewAspect === 'wide';

  return (
    <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {uploading && (
            <span className="text-xs text-amber-400 font-medium animate-pulse">
              ⏳ Compressing...
            </span>
          )}
          {compressedSize !== null && !uploading && (
            <span className="text-xs text-emerald-400 font-mono font-medium">
              ✅ {compressedSize} KB
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-500">Max {effectiveMaxKB} KB</span>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col sm:flex-row items-center gap-3.5 p-2 rounded-lg transition-all ${
          isDragging ? 'bg-orange-500/10 border border-dashed border-orange-500/60' : ''
        }`}
      >
        {/* Preview Box */}
        <div
          className={`relative rounded-xl border border-white/10 overflow-hidden bg-black/60 shrink-0 flex items-center justify-center ${
            isWide ? 'w-full sm:w-48 h-24' : 'w-16 h-16 sm:w-20 sm:h-20'
          }`}
          style={!isWide ? { width: previewSize, height: previewSize } : undefined}
        >
          {currentValue ? (
            <img
              src={currentValue}
              alt={label}
              className={`w-full h-full ${isWide ? 'object-cover' : 'object-contain'} p-0.5`}
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.3';
              }}
            />
          ) : defaultFallback ? (
            <img
              src={defaultFallback}
              alt="Default Fallback"
              className={`w-full h-full ${isWide ? 'object-cover' : 'object-contain'} opacity-40 p-0.5`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 p-2 text-center">
              <ImageIcon className="w-5 h-5 mb-0.5 opacity-60" />
              <span className="text-[9px] uppercase font-mono">None</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-orange-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-[9px] font-mono font-bold">Compressing...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 w-full space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Compressing...' : 'Upload File'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />

            {defaultFallback && currentValue !== defaultFallback && (
              <button
                type="button"
                onClick={() => {
                  setCompressedSize(null);
                  onChange(defaultFallback);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
                title="Restore default asset"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Default</span>
              </button>
            )}

            {currentValue && (
              <button
                type="button"
                onClick={() => {
                  setCompressedSize(null);
                  onChange('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                title="Clear image"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* URL Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Or paste image URL (https://... or base64)..."
              value={currentValue?.startsWith('data:') ? 'Embedded Base64 Image (compressed)' : currentValue}
              onChange={(e) => {
                const val = e.target.value;
                if (!val.includes('Embedded Base64 Image')) {
                  onChange(val);
                }
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
