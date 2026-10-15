import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ImportDropZoneProps {
  onFileLoaded: (file: File) => void;
  isParsing?: boolean;
  selectedFile?: File | null;
  error?: string | null;
  onClear?: () => void;
}

export function ImportDropZone({
  onFileLoaded,
  isParsing = false,
  selectedFile,
  error,
  onClear,
}: ImportDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileLoaded(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileLoaded(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-orange-500 bg-orange-500/15 scale-[1.01]'
            : 'border-white/15 bg-white/[0.02] hover:border-orange-500/50 hover:bg-white/[0.04]',
          selectedFile && !error && 'border-emerald-500/50 bg-emerald-500/[0.03]',
          error && 'border-rose-500/50 bg-rose-500/[0.03]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.xlsx,.csv,.zip"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isParsing ? (
          <div className="flex flex-col items-center space-y-2">
            <RefreshCw className="w-10 h-10 text-orange-400 animate-spin" />
            <span className="text-xs font-bold text-white">Inspecting & Parsing File...</span>
            <span className="text-[11px] text-gray-400">Validating tournament schema</span>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block max-w-xs truncate">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {formatFileSize(selectedFile.size)} • Ready to inspect
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline mt-1 cursor-pointer"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Drag & drop tournament file here
              </span>
              <span className="text-xs text-gray-400 mt-0.5 block">
                or click to browse from device
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-gray-500 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">.JSON</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">.XLSX</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">.CSV</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">.ZIP</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
