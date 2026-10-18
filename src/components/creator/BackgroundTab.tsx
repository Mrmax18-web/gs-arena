import React, { useState } from 'react';
import { useBackground } from '../../context/BackgroundContext';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { saveBackgroundConfig } from '../../services/configService';
import { DEFAULT_BACKGROUND_CONFIG } from '../../lib/constants';

export const BackgroundTab: React.FC = () => {
  const { config, updateConfig, resetToDefaults } = useBackground();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);

  const handleColorChange = (index: number, val: string) => {
    const colors = [...(config.colors || DEFAULT_BACKGROUND_CONFIG.colors)];
    colors[index] = val;
    updateConfig({ colors });
  };

  const handleSaveToCloud = async () => {
    setSaving(true);
    try {
      await saveBackgroundConfig(config);
      success('Background Preset Saved', 'WebGL uniforms persisted globally for all viewers.');
    } catch (err: any) {
      error('Save Failed', err?.message || 'Failed to save background configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <GlassCard strong className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              WebGL Twist Ribbon Controls
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live hardware-accelerated fragment shader uniforms. Changes update instantaneously without remounting.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetToDefaults}>
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

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Wave Animation Speed</span>
              <span className="font-mono text-brand-500">{(config.speed ?? 11).toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="20.0"
              step="0.5"
              value={config.speed ?? 11}
              onChange={(e) => updateConfig({ speed: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Density */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Ribbon Frequency & Density</span>
              <span className="font-mono text-brand-500">{(config.density ?? 1.5).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={config.density ?? 1.5}
              onChange={(e) => updateConfig({ density: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Angle */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Rotation Angle</span>
              <span className="font-mono text-brand-500">{Math.round(config.angle ?? 45)}&deg;</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={config.angle ?? 45}
              onChange={(e) => updateConfig({ angle: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Shader Opacity</span>
              <span className="font-mono text-brand-500">{Math.round((config.opacity ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.opacity ?? 1.0}
              onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>
        </div>


        {/* Color Palette */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Shader Color Palette (Hex)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(config.colors || DEFAULT_BACKGROUND_CONFIG.colors).slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20"
              >
                <input
                  type="color"
                  value={c}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <div className="text-xs">
                  <span className="block text-[10px] text-slate-400 font-semibold">Color #{i + 1}</span>
                  <span className="font-mono font-bold uppercase">{c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
