import React, { useRef, useState } from 'react';
import { Upload, X, Check, AlertCircle, Link as LinkIcon, Box, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { validateGlbFile, fileToGlbBase64 } from '../../lib/imageUtils';
import { storage } from '../../lib/firebase';
import type { GunOption } from '../../lib/brandingDefaults';

export interface GunModelPickerProps {
  label: string; // e.g. "Primary Gun" or "Secondary Gun"
  gunName: string;
  onGunNameChange: (val: string) => void;
  modelPath: string;
  onModelPathChange: (val: string) => void;
  modelUrl?: string;
  onModelUrlChange?: (val: string) => void;
  scale?: number;
  onScaleChange?: (val: number) => void;
  rotation?: number;
  onRotationChange?: (val: number) => void;
  options: GunOption[];
  disabled?: boolean;
}

export function GunModelPicker({
  label,
  gunName,
  onGunNameChange,
  modelPath,
  onModelPathChange,
  modelUrl = '',
  onModelUrlChange,
  scale = 1,
  onScaleChange,
  rotation = 0,
  onRotationChange,
  options,
  disabled = false,
}: GunModelPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const activeModel = modelUrl || modelPath;

  // Determine current dropdown value
  const matchedOption = options.find(
    (opt) =>
      opt.value.toLowerCase() === gunName.toLowerCase() ||
      opt.defaultModel === activeModel
  );

  const isCustomModel =
    Boolean(modelUrl) ||
    activeModel?.startsWith('data:') ||
    activeModel?.startsWith('http://') ||
    activeModel?.startsWith('https://') ||
    matchedOption?.value === 'Custom' ||
    (!matchedOption && Boolean(activeModel));

  const dropdownValue = matchedOption
    ? matchedOption.value
    : isCustomModel
    ? 'Custom'
    : options[0]?.value || '';

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setUploadError(null);

    if (selected === 'Custom') {
      setShowUrlInput(true);
    } else {
      setShowUrlInput(false);
      const opt = options.find((o) => o.value === selected);
      if (opt) {
        onGunNameChange(opt.value);
        onModelPathChange(opt.defaultModel);
        if (onModelUrlChange) onModelUrlChange('');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate extension
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      setUploadError('Only .glb and .gltf files allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (20 MB limit)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log(`[Creator] Uploading .glb to Firebase Storage: ${file.name}`);
      const storageRef = ref(storage, `gun-models/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(p);
          }
        },
        async (storageErr) => {
          console.warn('[Creator] Firebase Storage upload notice, switching to base64 fallback:', storageErr);
          try {
            // Fallback to local base64 if storage is restricted
            const base64 = await fileToGlbBase64(file);
            onModelPathChange(base64);
            if (onModelUrlChange) onModelUrlChange(base64);
            if (!gunName || gunName === 'Custom') {
              const simpleName = file.name.replace(/\.(glb|gltf)$/i, '').toUpperCase();
              onGunNameChange(simpleName);
            }
            console.log('[Creator] Model saved as fallback base64');
          } catch (fallbackErr) {
            setUploadError('Upload failed: ' + storageErr.message);
          } finally {
            setIsUploading(false);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[Creator] GLB uploaded to cloud:', downloadUrl);
            onModelPathChange(downloadUrl);
            if (onModelUrlChange) onModelUrlChange(downloadUrl);
            if (!gunName || gunName === 'Custom') {
              const simpleName = file.name.replace(/\.(glb|gltf)$/i, '').toUpperCase();
              onGunNameChange(simpleName);
            }
          } catch (urlErr) {
            console.error('[Creator] Error getting download URL:', urlErr);
            setUploadError('Could not retrieve uploaded model URL');
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (err) {
      console.error('[Creator] Storage init error, using local base64:', err);
      try {
        const base64 = await fileToGlbBase64(file);
        onModelPathChange(base64);
        if (onModelUrlChange) onModelUrlChange(base64);
        if (!gunName || gunName === 'Custom') {
          const simpleName = file.name.replace(/\.(glb|gltf)$/i, '').toUpperCase();
          onGunNameChange(simpleName);
        }
      } catch (fallbackErr) {
        setUploadError((err as Error).message);
      } finally {
        setIsUploading(false);
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    const cleanUrl = customUrl.trim();
    if (!cleanUrl.endsWith('.glb') && !cleanUrl.endsWith('.gltf') && !cleanUrl.includes('model')) {
      setUploadError('URL should point to a .glb or .gltf file');
      return;
    }
    setUploadError(null);
    onModelPathChange(cleanUrl);
    if (onModelUrlChange) onModelUrlChange(cleanUrl);
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleClearModel = () => {
    const defaultOpt = options[0];
    if (defaultOpt) {
      onGunNameChange(defaultOpt.value);
      onModelPathChange(defaultOpt.defaultModel);
      if (onModelUrlChange) onModelUrlChange('');
    }
    setUploadError(null);
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-black/40 border border-white/10">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
          <Box size={14} className="text-orange-400" />
          {label}
        </label>
        {isCustomModel && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Custom Model Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Gun Name input */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Gun Name</label>
          <Input
            value={gunName}
            onChange={(e) => onGunNameChange(e.target.value)}
            disabled={disabled}
            placeholder="e.g. AWM, M416"
            className="h-10 text-xs font-mono"
          />
        </div>

        {/* Gun Model selection dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">3D Gun Model</label>
          <select
            value={dropdownValue}
            onChange={handleDropdownChange}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/20 text-xs font-mono text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Model Scale & Rotation Controls */}
      {(onScaleChange || onRotationChange) && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
          {onScaleChange && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Scale Multiplier</span>
                <span className="text-amber-400 font-bold">{scale}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {onRotationChange && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span>Y-Axis Offset</span>
                <span className="text-amber-400 font-bold">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation}
                onChange={(e) => onRotationChange(parseInt(e.target.value, 10))}
                disabled={disabled}
                className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload and URL controls */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-9 min-h-[36px] bg-orange-500/20 border border-orange-500/40 hover:bg-orange-500/30 text-white"
          >
            {isUploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-orange-400" />
                <span>⏳ {Math.round(uploadProgress)}%</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Upload size={13} />
                <span>📤 Upload .glb</span>
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => setShowUrlInput((v) => !v)}
            className="text-xs h-9 min-h-[36px] text-gray-300 hover:text-white"
          >
            <LinkIcon size={14} className="mr-1.5" />
            {showUrlInput ? 'Hide URL' : 'Link Model URL'}
          </Button>

          {isCustomModel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={handleClearModel}
              className="text-xs h-9 min-h-[36px] text-rose-400 hover:text-rose-300 ml-auto"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Model Status info */}
        {activeModel && (
          <div className="text-[11px] font-mono text-gray-400 truncate bg-black/50 px-2.5 py-1.5 rounded border border-white/5 flex items-center gap-1.5">
            <Check size={12} className="text-emerald-400 shrink-0" />
            <span className="text-gray-500">Active Model: </span>
            {activeModel.startsWith('data:') ? (
              <span className="text-emerald-400">Embedded Base64 Model ({(activeModel.length / 1024).toFixed(0)} KB)</span>
            ) : (
              <span className="text-amber-300 truncate">{activeModel.split('/').pop()}</span>
            )}
          </div>
        )}

        {/* URL Input Form */}
        {showUrlInput && (
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://.../weapon.glb or /models/awm.glb"
              className="h-9 text-xs font-mono flex-1"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApplyUrl}
              disabled={disabled || !customUrl.trim()}
              className="h-9 px-3 text-xs"
            >
              Apply
            </Button>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
            <AlertCircle size={14} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
