import React, { useState } from 'react';
import { AppearanceConfig, SystemConfig } from '../../types/config';
import { Tournament } from '../../types/tournament';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { saveSystemConfig } from '../../services/configService';
import { AppearanceSchema } from '../../lib/validators';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { tournamentConverter } from '../../lib/converters';
import { Icon } from '@iconify/react';

interface AppearanceTabProps {
  systemConfig?: SystemConfig;
  onSaved?: () => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ systemConfig, onSaved }) => {
  const { success, error } = useToast();

  const initialAppearance = systemConfig?.appearance || {};
  const [bgmiIconUrl, setBgmiIconUrl] = useState(initialAppearance.bgmiIconUrl || '');
  const [ffIconUrl, setFfIconUrl] = useState(initialAppearance.ffIconUrl || '');
  const [arenaLogoUrl, setArenaLogoUrl] = useState(initialAppearance.arenaLogoUrl || '');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Image load error states for preview guards
  const [bgmiError, setBgmiError] = useState(false);
  const [ffError, setFfError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Load tournaments for read-only UPI / fee inspection
  const { data: tournaments } = useFirestoreCollection<Tournament>(
    'tournaments',
    [],
    tournamentConverter
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const dataToValidate = {
      bgmiIconUrl: bgmiIconUrl.trim(),
      ffIconUrl: ffIconUrl.trim(),
      arenaLogoUrl: arenaLogoUrl.trim(),
    };

    const parseResult = AppearanceSchema.safeParse(dataToValidate);
    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      for (const err of parseResult.error.errors) {
        const path = err.path.join('.');
        errMap[path] = err.message;
      }
      setFieldErrors(errMap);
      error('Validation Failed', parseResult.error.errors[0]?.message || 'Please fix URL errors.');
      return;
    }

    setSaving(true);
    try {
      const newAppearance: AppearanceConfig = {
        bgmiIconUrl: bgmiIconUrl.trim(),
        ffIconUrl: ffIconUrl.trim(),
        arenaLogoUrl: arenaLogoUrl.trim(),
        updatedAt: new Date().toISOString(),
      };

      await saveSystemConfig({
        appearance: newAppearance,
      });

      success('Appearance Saved', 'Game icons and logo updated across GS Arena.');
      if (onSaved) onSaved();
    } catch (err: any) {
      error('Save Failed', err?.message || 'Failed to update appearance.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setBgmiIconUrl('');
    setFfIconUrl('');
    setArenaLogoUrl('');
    setFieldErrors({});
    setBgmiError(false);
    setFfError(false);
    setLogoError(false);
  };

  return (
    <div className="space-y-6 text-left">
      <GlassCard strong className="p-6 space-y-6">
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Icon icon="solar:palette-bold" className="text-brand-500" />
                Custom Game Icons & Brand Appearance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure HTTPS image assets for game titles and GS Arena branding. GameSelectPage renders these icons with instant fallback.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Creator Only
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GS Arena Logo */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                GS Arena Brand Logo
              </span>
              <Input
                placeholder="https://.../arena-logo.png"
                value={arenaLogoUrl}
                onChange={(e) => {
                  setArenaLogoUrl(e.target.value);
                  setLogoError(false);
                }}
                error={fieldErrors['arenaLogoUrl']}
                helperText="Must be a valid HTTPS image URL"
              />
              <div className="h-24 rounded-lg bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 overflow-hidden">
                {arenaLogoUrl && !logoError ? (
                  <img
                    src={arenaLogoUrl}
                    alt="GS Arena Logo Preview"
                    onError={() => setLogoError(true)}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-500">
                    <Icon icon="solar:cup-star-bold" className="text-2xl mx-auto mb-1 text-slate-400" />
                    <span>Default Icon Fallback</span>
                  </div>
                )}
              </div>
            </div>

            {/* BGMI Icon */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                BGMI Game Icon
              </span>
              <Input
                placeholder="https://.../bgmi-icon.png"
                value={bgmiIconUrl}
                onChange={(e) => {
                  setBgmiIconUrl(e.target.value);
                  setBgmiError(false);
                }}
                error={fieldErrors['bgmiIconUrl']}
                helperText="Must be a valid HTTPS image URL"
              />
              <div className="h-24 rounded-lg bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 overflow-hidden">
                {bgmiIconUrl && !bgmiError ? (
                  <img
                    src={bgmiIconUrl}
                    alt="BGMI Icon Preview"
                    onError={() => setBgmiError(true)}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-500">
                    <Icon icon="solar:fire-bold" className="text-2xl mx-auto mb-1 text-amber-500" />
                    <span>Default Flame Icon Fallback</span>
                  </div>
                )}
              </div>
            </div>

            {/* Free Fire Icon */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Free Fire Game Icon
              </span>
              <Input
                placeholder="https://.../freefire-icon.png"
                value={ffIconUrl}
                onChange={(e) => {
                  setFfIconUrl(e.target.value);
                  setFfError(false);
                }}
                error={fieldErrors['ffIconUrl']}
                helperText="Must be a valid HTTPS image URL"
              />
              <div className="h-24 rounded-lg bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 overflow-hidden">
                {ffIconUrl && !ffError ? (
                  <img
                    src={ffIconUrl}
                    alt="Free Fire Icon Preview"
                    onError={() => setFfError(true)}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-500">
                    <Icon icon="solar:shield-star-bold" className="text-2xl mx-auto mb-1 text-indigo-500" />
                    <span>Default Shield Icon Fallback</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
              Clear Fields
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              icon="solar:check-read-bold"
            >
              Save Appearance
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Read-Only Tournament Payment & QR Inspector */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon icon="solar:bill-check-bold" className="text-emerald-500" />
              Tournament Payment & QR Inspector
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Read-only view of active entry fees and UPI payment endpoints configured by tournament administrators.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Read-Only
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tournaments || []).map((t) => {
            const feeINR = (t.entryFeePaise ?? 0) / 100;
            return (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500">
                    {t.gameId}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {t.upiQrUrl ? (
                    <img
                      src={t.upiQrUrl}
                      alt="UPI QR"
                      className="h-16 w-16 rounded-lg object-contain bg-white p-1 border border-slate-300 dark:border-white/10"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-black/20 flex items-center justify-center text-[10px] text-slate-500 text-center p-1">
                      No QR Uploaded
                    </div>
                  )}

                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Entry Fee: </span>
                      <strong className="text-amber-500 font-mono">
                        {feeINR > 0 ? `₹${feeINR.toFixed(2)} INR` : 'Free Entry'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">UPI ID: </span>
                      <strong className="font-mono text-slate-300">
                        {t.upiId || 'Not configured'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
