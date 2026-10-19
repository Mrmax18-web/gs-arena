import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBackground } from '../../context/BackgroundContext';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { saveBackgroundConfig } from '../../services/configService';
import { DEFAULT_BACKGROUND_CONFIG } from '../../lib/constants';
import { Icon } from '@iconify/react';

interface ColorFieldDef {
  key: string;
  isAdvanced: boolean;
  label: string;
  description: string;
  defaultVal: string;
}

const COLOR_FIELDS: ColorFieldDef[] = [
  { key: 'background', isAdvanced: false, label: 'Canvas Background', description: 'Overall backdrop color behind the shader canvas', defaultVal: '#000000' },
  { key: 'baseColor', isAdvanced: false, label: 'Base Ribbon Color', description: 'Primary ribbon wave gradient base', defaultVal: '#DE0202' },
  { key: 'accentColor', isAdvanced: false, label: 'Accent Color', description: 'Secondary wave contrast and highlight tone', defaultVal: '#D10000' },
  { key: 'goldColor', isAdvanced: true, label: 'Gold Highlight', description: 'Warm crest lighting uniform (uGold)', defaultVal: '#FF0000' },
  { key: 'highColor', isAdvanced: true, label: 'High Color', description: 'Bright apex surface illumination (uHigh)', defaultVal: '#CF2A2A' },
  { key: 'blueDeep', isAdvanced: true, label: 'Deep Tone', description: 'Inner ribbon fold shadow tone (uBlueDeep)', defaultVal: '#E42222' },
  { key: 'blueHigh', isAdvanced: true, label: 'High Tone', description: 'Outer crest reflection tint (uBlueHigh)', defaultVal: '#A50B0B' },
  { key: 'paleColor', isAdvanced: true, label: 'Pale Tint', description: 'Soft diffusion ambient tone (uPale)', defaultVal: '#F8F4EA' },
  { key: 'coolTint', isAdvanced: true, label: 'Cool Tint', description: 'Cool backlight rim reflection (uCoolTint)', defaultVal: '#DCE6F5' },
];

function normalizeHex(input: string): string {
  let val = input.trim();
  if (!val.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(val)) {
    val = '#' + val;
  }
  return val.toUpperCase();
}

function isValidHex(hex: string): boolean {
  return /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(hex.trim());
}

export const BackgroundTab: React.FC = () => {
  const { config, updateConfig, resetToDefaults } = useBackground();
  const { success, error } = useToast();

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // Local text input states so user can type freely without cursor jumping
  const [textValues, setTextValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of COLOR_FIELDS) {
      if (f.isAdvanced) {
        initial[f.key] = ((config.advanced as any)?.[f.key] ?? f.defaultVal).toUpperCase();
      } else {
        initial[f.key] = ((config as any)[f.key] ?? f.defaultVal).toUpperCase();
      }
    }
    return initial;
  });

  // Sync text inputs when config changes from external snapshots
  useEffect(() => {
    setTextValues((prev) => {
      const next = { ...prev };
      for (const f of COLOR_FIELDS) {
        const cloudVal = f.isAdvanced
          ? (config.advanced as any)?.[f.key]
          : (config as any)[f.key];
        if (cloudVal && isValidHex(cloudVal) && !inlineErrors[f.key]) {
          next[f.key] = cloudVal.toUpperCase();
        }
      }
      return next;
    });
  }, [config, inlineErrors]);

  // Debounced auto-save ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const persistToFirestoreDebounced = useCallback((updatedConfig: typeof config) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSaveStatus('saving');
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveBackgroundConfig(updatedConfig);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err: any) {
        setSaveStatus('idle');
        console.error('Debounced background config save failed:', err?.message);
      }
    }, 400); // 400ms debounce
  }, []);

  const handleColorUpdate = (key: string, isAdvanced: boolean, rawValue: string) => {
    const normalized = normalizeHex(rawValue);

    // Update local text representation
    setTextValues((prev) => ({ ...prev, [key]: normalized }));

    if (!isValidHex(normalized)) {
      setInlineErrors((prev) => ({
        ...prev,
        [key]: 'Invalid hex (e.g. #FF0000 or #FFF)',
      }));
      return;
    }

    // Clear error if valid
    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    // Prepare updated config object
    let nextConfig: typeof config;
    if (isAdvanced) {
      const newAdvanced = {
        ...(config.advanced || {}),
        [key]: normalized,
      };
      nextConfig = {
        ...config,
        advanced: newAdvanced,
      };
      updateConfig({ advanced: newAdvanced });
    } else {
      nextConfig = {
        ...config,
        [key]: normalized,
        // Keep legacy colors array in sync if base or accent changes
        colors:
          key === 'baseColor'
            ? [normalized, config.accentColor || DEFAULT_BACKGROUND_CONFIG.accentColor || '#D10000']
            : key === 'accentColor'
            ? [config.baseColor || DEFAULT_BACKGROUND_CONFIG.baseColor || '#DE0202', normalized]
            : (config.colors || ['#DE0202', '#D10000']),
      };
      updateConfig({
        [key]: normalized,
        ...(key === 'baseColor' || key === 'accentColor' ? { colors: nextConfig.colors } : {}),
      });
    }

    // Trigger debounced Firestore persist
    persistToFirestoreDebounced(nextConfig);
  };

  const handleSaveToCloud = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSaving(true);
    try {
      await saveBackgroundConfig(config);
      setSaveStatus('saved');
      success('Background Preset Saved', 'All 9 WebGL color uniforms persisted globally.');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      error('Save Failed', err?.message || 'Failed to save background configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    resetToDefaults();
    const defaultsMap: Record<string, string> = {};
    for (const f of COLOR_FIELDS) {
      defaultsMap[f.key] = f.defaultVal;
    }
    setTextValues(defaultsMap);
    setInlineErrors({});
    persistToFirestoreDebounced(DEFAULT_BACKGROUND_CONFIG);
    success('Defaults Restored', 'Reset to official GS Arena red & gold palette.');
  };

  return (
    <div className="space-y-6 text-left">
      <GlassCard strong className="p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                WebGL Twist Ribbon Controls
              </h4>
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 animate-pulse">
                  <Icon icon="solar:refresh-circle-bold" className="animate-spin" />
                  Auto-saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                  <Icon icon="solar:check-circle-bold" />
                  Synced to Cloud
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live hardware-accelerated fragment shader uniforms. Color changes sync instantaneously and persist to Firestore with debouncing.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset Defaults
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSaveToCloud}
              icon="solar:diskette-bold"
            >
              Save Globally
            </Button>
          </div>
        </div>

        {/* Sliders: Speed, Scale, Hover, Split, Grain */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="wave-speed-slider">Animation Speed</label>
              <span className="font-mono text-brand-500">{(config.speed ?? 11).toFixed(0)}</span>
            </div>
            <input
              id="wave-speed-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.speed ?? 11}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const next = { ...config, speed: val };
                updateConfig({ speed: val });
                persistToFirestoreDebounced(next);
              }}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="ribbon-scale-slider">Ribbon Scale</label>
              <span className="font-mono text-brand-500">{(config.scale ?? 96).toFixed(0)}%</span>
            </div>
            <input
              id="ribbon-scale-slider"
              type="range"
              min="20"
              max="200"
              step="2"
              value={config.scale ?? 96}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const next = { ...config, scale: val };
                updateConfig({ scale: val });
                persistToFirestoreDebounced(next);
              }}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Color Split */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="color-split-slider">Gradient Split Position</label>
              <span className="font-mono text-brand-500">{config.colorSplit ?? 22}%</span>
            </div>
            <input
              id="color-split-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.colorSplit ?? 22}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                const next = { ...config, colorSplit: val };
                updateConfig({ colorSplit: val });
                persistToFirestoreDebounced(next);
              }}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        {/* 9 Configurable Colors Grid */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Twist Ribbon Shader Color Uniforms (Hex)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Click the swatch for the native color picker or type a hex code directly. Auto-normalizes and validates in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLOR_FIELDS.map((f) => {
              const currentVal = textValues[f.key] || f.defaultVal;
              const hasErr = Boolean(inlineErrors[f.key]);
              const inputId = `color-hex-${f.key}`;
              const pickerId = `color-picker-${f.key}`;

              // Derive valid hex for the color swatch picker (must be 6-digit hex)
              const pickerVal =
                isValidHex(currentVal) && (currentVal.length === 7 || currentVal.length === 4)
                  ? currentVal.length === 4
                    ? `#${currentVal[1]}${currentVal[1]}${currentVal[2]}${currentVal[2]}${currentVal[3]}${currentVal[3]}`
                    : currentVal.slice(0, 7)
                  : f.defaultVal;

              return (
                <div
                  key={f.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    hasErr
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor={inputId}
                      className="block text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {f.label}
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {f.isAdvanced ? `adv.${f.key}` : f.key}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                    {f.description}
                  </p>

                  <div className="flex items-center gap-2.5">
                    {/* Native Color Picker Swatch */}
                    <div className="relative shrink-0">
                      <input
                        id={pickerId}
                        type="color"
                        aria-label={`${f.label} color picker`}
                        value={pickerVal}
                        onChange={(e) => handleColorUpdate(f.key, f.isAdvanced, e.target.value)}
                        className="h-9 w-9 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0"
                      />
                    </div>

                    {/* Validated Hex Text Input */}
                    <div className="flex-1">
                      <input
                        id={inputId}
                        type="text"
                        aria-label={`${f.label} hex code`}
                        aria-invalid={hasErr}
                        aria-describedby={hasErr ? `${inputId}-error` : undefined}
                        value={currentVal}
                        maxLength={9}
                        placeholder="#000000"
                        onChange={(e) => handleColorUpdate(f.key, f.isAdvanced, e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold uppercase transition-all bg-white/80 dark:bg-black/40 ${
                          hasErr
                            ? 'border-rose-500 text-rose-500 focus:outline-rose-500'
                            : 'border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Inline Error Message */}
                  {hasErr && (
                    <p
                      id={`${inputId}-error`}
                      role="alert"
                      className="flex items-center gap-1 text-[11px] text-rose-500 mt-1.5 font-medium"
                    >
                      <Icon icon="solar:danger-triangle-bold" className="shrink-0 text-xs" />
                      <span>{inlineErrors[f.key]}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
