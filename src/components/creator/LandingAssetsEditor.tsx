import React, { useState, useEffect, useRef } from 'react';
import { Target, Save, RotateCcw, Image as ImageIcon, Upload, Link as LinkIcon, X, Check, AlertCircle } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';
import { DEFAULT_BRANDING, BGMI_GUN_OPTIONS, FREE_FIRE_GUN_OPTIONS } from '../../lib/brandingDefaults';
import { WeaponConfigSection } from './WeaponConfigSection';
import { compressImage } from '../../lib/imageUtils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function LandingAssetsEditor() {
  const { branding, updateBranding } = useBranding();

  const [form, setForm] = useState({
    landingBgmiLogo: branding.landingBgmiLogo || DEFAULT_BRANDING.landingBgmiLogo,
    landingFFLogo: branding.landingFFLogo || DEFAULT_BRANDING.landingFFLogo,
    bgmiPrimaryGun: branding.bgmiPrimaryGun || DEFAULT_BRANDING.bgmiPrimaryGun,
    bgmiPrimaryGunModel: branding.bgmiPrimaryGunModel || DEFAULT_BRANDING.bgmiPrimaryGunModel,
    bgmiPrimaryGunModelUrl: branding.bgmiPrimaryGunModelUrl || '',
    bgmiPrimaryGunScale: branding.bgmiPrimaryGunScale ?? 1,
    bgmiPrimaryGunRotation: branding.bgmiPrimaryGunRotation ?? 0,

    bgmiSecondaryGun: branding.bgmiSecondaryGun || DEFAULT_BRANDING.bgmiSecondaryGun,
    bgmiSecondaryGunModel: branding.bgmiSecondaryGunModel || DEFAULT_BRANDING.bgmiSecondaryGunModel,
    bgmiSecondaryGunModelUrl: branding.bgmiSecondaryGunModelUrl || '',
    bgmiSecondaryGunScale: branding.bgmiSecondaryGunScale ?? 1,
    bgmiSecondaryGunRotation: branding.bgmiSecondaryGunRotation ?? 0,

    ffPrimaryGun: branding.ffPrimaryGun || DEFAULT_BRANDING.ffPrimaryGun,
    ffPrimaryGunModel: branding.ffPrimaryGunModel || DEFAULT_BRANDING.ffPrimaryGunModel,
    ffPrimaryGunModelUrl: branding.ffPrimaryGunModelUrl || '',
    ffPrimaryGunScale: branding.ffPrimaryGunScale ?? 1,
    ffPrimaryGunRotation: branding.ffPrimaryGunRotation ?? 0,

    ffSecondaryGun: branding.ffSecondaryGun || DEFAULT_BRANDING.ffSecondaryGun,
    ffSecondaryGunModel: branding.ffSecondaryGunModel || DEFAULT_BRANDING.ffSecondaryGunModel,
    ffSecondaryGunModelUrl: branding.ffSecondaryGunModelUrl || '',
    ffSecondaryGunScale: branding.ffSecondaryGunScale ?? 1,
    ffSecondaryGunRotation: branding.ffSecondaryGunRotation ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Logo URL popovers
  const [editingUrlKey, setEditingUrlKey] = useState<'bgmi' | 'ff' | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const bgmiFileInputRef = useRef<HTMLInputElement>(null);
  const ffFileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setForm({
      landingBgmiLogo: branding.landingBgmiLogo || DEFAULT_BRANDING.landingBgmiLogo,
      landingFFLogo: branding.landingFFLogo || DEFAULT_BRANDING.landingFFLogo,
      bgmiPrimaryGun: branding.bgmiPrimaryGun || DEFAULT_BRANDING.bgmiPrimaryGun,
      bgmiPrimaryGunModel: branding.bgmiPrimaryGunModel || DEFAULT_BRANDING.bgmiPrimaryGunModel,
      bgmiPrimaryGunModelUrl: branding.bgmiPrimaryGunModelUrl || '',
      bgmiPrimaryGunScale: branding.bgmiPrimaryGunScale ?? 1,
      bgmiPrimaryGunRotation: branding.bgmiPrimaryGunRotation ?? 0,

      bgmiSecondaryGun: branding.bgmiSecondaryGun || DEFAULT_BRANDING.bgmiSecondaryGun,
      bgmiSecondaryGunModel: branding.bgmiSecondaryGunModel || DEFAULT_BRANDING.bgmiSecondaryGunModel,
      bgmiSecondaryGunModelUrl: branding.bgmiSecondaryGunModelUrl || '',
      bgmiSecondaryGunScale: branding.bgmiSecondaryGunScale ?? 1,
      bgmiSecondaryGunRotation: branding.bgmiSecondaryGunRotation ?? 0,

      ffPrimaryGun: branding.ffPrimaryGun || DEFAULT_BRANDING.ffPrimaryGun,
      ffPrimaryGunModel: branding.ffPrimaryGunModel || DEFAULT_BRANDING.ffPrimaryGunModel,
      ffPrimaryGunModelUrl: branding.ffPrimaryGunModelUrl || '',
      ffPrimaryGunScale: branding.ffPrimaryGunScale ?? 1,
      ffPrimaryGunRotation: branding.ffPrimaryGunRotation ?? 0,

      ffSecondaryGun: branding.ffSecondaryGun || DEFAULT_BRANDING.ffSecondaryGun,
      ffSecondaryGunModel: branding.ffSecondaryGunModel || DEFAULT_BRANDING.ffSecondaryGunModel,
      ffSecondaryGunModelUrl: branding.ffSecondaryGunModelUrl || '',
      ffSecondaryGunScale: branding.ffSecondaryGunScale ?? 1,
      ffSecondaryGunRotation: branding.ffSecondaryGunRotation ?? 0,
    });
  }, [branding]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleLogoUpload = async (key: 'landingBgmiLogo' | 'landingFFLogo', file?: File) => {
    if (!file) return;
    try {
      setSaveStatus(null);
      console.log(`[LandingAssets] Compressing uploaded logo for ${key}: ${file.name}`);
      const base64 = await compressImage(file, 'icon');
      setForm((prev) => ({ ...prev, [key]: base64 }));
    } catch (err) {
      console.error('[LandingAssets] Failed to process logo upload:', err);
      setSaveStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to process logo file',
      });
    }
  };

  const applyUrlLogo = (key: 'landingBgmiLogo' | 'landingFFLogo') => {
    if (!urlInput.trim()) return;
    setForm((prev) => ({ ...prev, [key]: urlInput.trim() }));
    setUrlInput('');
    setEditingUrlKey(null);
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setSaveStatus({ type: 'info', message: 'Saving landing page assets to cloud...' });
    console.log('[LandingAssets] Saving landing assets configuration...');

    // 15-second safety timeout
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      console.warn('[LandingAssets] ⏰ Save timed out after 15s');
      setSaving(false);
      setSaveStatus({
        type: 'error',
        message: 'Save timed out. Changes are stored in local browser cache.',
      });
    }, 15000);

    try {
      await updateBranding(form);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      console.log('[LandingAssets] ✅ Successfully saved landing assets');
      setSaving(false);
      setSaveStatus({
        type: 'success',
        message: '✅ Landing page assets saved! Broadcast to all players in real-time.',
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      console.error('[LandingAssets] Save failed:', err);
      setSaving(false);
      setSaveStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save landing page assets',
      });
    }
  };

  const handleResetToDefaults = () => {
    setForm({
      landingBgmiLogo: DEFAULT_BRANDING.landingBgmiLogo,
      landingFFLogo: DEFAULT_BRANDING.landingFFLogo,
      bgmiPrimaryGun: DEFAULT_BRANDING.bgmiPrimaryGun,
      bgmiPrimaryGunModel: DEFAULT_BRANDING.bgmiPrimaryGunModel,
      bgmiPrimaryGunModelUrl: '',
      bgmiPrimaryGunScale: 1,
      bgmiPrimaryGunRotation: 0,

      bgmiSecondaryGun: DEFAULT_BRANDING.bgmiSecondaryGun,
      bgmiSecondaryGunModel: DEFAULT_BRANDING.bgmiSecondaryGunModel,
      bgmiSecondaryGunModelUrl: '',
      bgmiSecondaryGunScale: 1,
      bgmiSecondaryGunRotation: 0,

      ffPrimaryGun: DEFAULT_BRANDING.ffPrimaryGun,
      ffPrimaryGunModel: DEFAULT_BRANDING.ffPrimaryGunModel,
      ffPrimaryGunModelUrl: '',
      ffPrimaryGunScale: 1,
      ffPrimaryGunRotation: 0,

      ffSecondaryGun: DEFAULT_BRANDING.ffSecondaryGun,
      ffSecondaryGunModel: DEFAULT_BRANDING.ffSecondaryGunModel,
      ffSecondaryGunModelUrl: '',
      ffSecondaryGunScale: 1,
      ffSecondaryGunRotation: 0,
    });
    setSaveStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <span>🎯 Landing Page Assets</span>
          </h3>
          <p className="text-xs text-gray-400">
            Customize 3D hero weapons, models, labels, and arena insignia on the main landing portal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={saving}
            className="text-xs text-gray-400 hover:text-white"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Reset Defaults
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs"
          >
            <Save size={13} className="mr-1.5" />
            {saving ? 'Saving...' : '💾 Save Landing Page Assets'}
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {saveStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : saveStatus.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
          }`}
        >
          {saveStatus.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* SECTION 1 — ARENA LOGOS */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <ImageIcon className="w-4 h-4 text-orange-400" />
          <h4 className="font-bold text-white text-sm uppercase tracking-wider font-['Teko',sans-serif] text-xl">
            🖼️ Arena Logos
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BGMI Logo */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-orange-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                BGMI Icon
              </span>
              <span className="text-[10px] font-mono text-gray-400">64x64 Preview</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-black/80 border border-orange-500/30 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-orange-500/10">
                <img
                  src={form.landingBgmiLogo}
                  alt="BGMI Icon Preview"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    ref={bgmiFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('landingBgmiLogo', e.target.files?.[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => bgmiFileInputRef.current?.click()}
                    disabled={saving}
                    className="text-xs h-8 px-2.5"
                  >
                    <Upload size={12} className="mr-1" />
                    Upload
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingUrlKey(editingUrlKey === 'bgmi' ? null : 'bgmi');
                      setUrlInput(form.landingBgmiLogo.startsWith('http') ? form.landingBgmiLogo : '');
                    }}
                    disabled={saving}
                    className="text-xs h-8 px-2.5 text-gray-300"
                  >
                    <LinkIcon size={12} className="mr-1" />
                    URL
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((p) => ({ ...p, landingBgmiLogo: DEFAULT_BRANDING.landingBgmiLogo }))}
                    disabled={saving}
                    className="text-xs h-8 px-2 text-rose-400 hover:text-rose-300 ml-auto"
                    title="Reset to default BGMI logo"
                  >
                    Clear
                  </Button>
                </div>

                {editingUrlKey === 'bgmi' && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://.../bgmi.png"
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => applyUrlLogo('landingBgmiLogo')}
                      className="h-8 px-2.5 text-xs"
                    >
                      Set
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Free Fire Logo */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Free Fire Icon
              </span>
              <span className="text-[10px] font-mono text-gray-400">64x64 Preview</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-black/80 border border-rose-500/30 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-rose-500/10">
                <img
                  src={form.landingFFLogo}
                  alt="Free Fire Icon Preview"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    ref={ffFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('landingFFLogo', e.target.files?.[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => ffFileInputRef.current?.click()}
                    disabled={saving}
                    className="text-xs h-8 px-2.5"
                  >
                    <Upload size={12} className="mr-1" />
                    Upload
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingUrlKey(editingUrlKey === 'ff' ? null : 'ff');
                      setUrlInput(form.landingFFLogo.startsWith('http') ? form.landingFFLogo : '');
                    }}
                    disabled={saving}
                    className="text-xs h-8 px-2.5 text-gray-300"
                  >
                    <LinkIcon size={12} className="mr-1" />
                    URL
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((p) => ({ ...p, landingFFLogo: DEFAULT_BRANDING.landingFFLogo }))}
                    disabled={saving}
                    className="text-xs h-8 px-2 text-rose-400 hover:text-rose-300 ml-auto"
                    title="Reset to default Free Fire logo"
                  >
                    Clear
                  </Button>
                </div>

                {editingUrlKey === 'ff' && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://.../freefire.png"
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => applyUrlLogo('landingFFLogo')}
                      className="h-8 px-2.5 text-xs"
                    >
                      Set
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — BGMI PANEL WEAPONS */}
      <WeaponConfigSection
        panelTitle="🔫 BGMI Panel Weapons"
        accent="orange"
        primaryGunName={form.bgmiPrimaryGun}
        primaryGunModel={form.bgmiPrimaryGunModel}
        onPrimaryGunNameChange={(val) => setForm((p) => ({ ...p, bgmiPrimaryGun: val }))}
        onPrimaryGunModelChange={(val) => setForm((p) => ({ ...p, bgmiPrimaryGunModel: val }))}
        primaryGunModelUrl={form.bgmiPrimaryGunModelUrl}
        onPrimaryGunModelUrlChange={(val) => setForm((p) => ({ ...p, bgmiPrimaryGunModelUrl: val }))}
        primaryGunScale={form.bgmiPrimaryGunScale}
        onPrimaryGunScaleChange={(val) => setForm((p) => ({ ...p, bgmiPrimaryGunScale: val }))}
        primaryGunRotation={form.bgmiPrimaryGunRotation}
        onPrimaryGunRotationChange={(val) => setForm((p) => ({ ...p, bgmiPrimaryGunRotation: val }))}

        secondaryGunName={form.bgmiSecondaryGun}
        secondaryGunModel={form.bgmiSecondaryGunModel}
        onSecondaryGunNameChange={(val) => setForm((p) => ({ ...p, bgmiSecondaryGun: val }))}
        onSecondaryGunModelChange={(val) => setForm((p) => ({ ...p, bgmiSecondaryGunModel: val }))}
        secondaryGunModelUrl={form.bgmiSecondaryGunModelUrl}
        onSecondaryGunModelUrlChange={(val) => setForm((p) => ({ ...p, bgmiSecondaryGunModelUrl: val }))}
        secondaryGunScale={form.bgmiSecondaryGunScale}
        onSecondaryGunScaleChange={(val) => setForm((p) => ({ ...p, bgmiSecondaryGunScale: val }))}
        secondaryGunRotation={form.bgmiSecondaryGunRotation}
        onSecondaryGunRotationChange={(val) => setForm((p) => ({ ...p, bgmiSecondaryGunRotation: val }))}

        options={BGMI_GUN_OPTIONS}
        disabled={saving}
      />

      {/* SECTION 3 — FREE FIRE PANEL WEAPONS */}
      <WeaponConfigSection
        panelTitle="🔫 Free Fire Panel Weapons"
        accent="red"
        primaryGunName={form.ffPrimaryGun}
        primaryGunModel={form.ffPrimaryGunModel}
        onPrimaryGunNameChange={(val) => setForm((p) => ({ ...p, ffPrimaryGun: val }))}
        onPrimaryGunModelChange={(val) => setForm((p) => ({ ...p, ffPrimaryGunModel: val }))}
        primaryGunModelUrl={form.ffPrimaryGunModelUrl}
        onPrimaryGunModelUrlChange={(val) => setForm((p) => ({ ...p, ffPrimaryGunModelUrl: val }))}
        primaryGunScale={form.ffPrimaryGunScale}
        onPrimaryGunScaleChange={(val) => setForm((p) => ({ ...p, ffPrimaryGunScale: val }))}
        primaryGunRotation={form.ffPrimaryGunRotation}
        onPrimaryGunRotationChange={(val) => setForm((p) => ({ ...p, ffPrimaryGunRotation: val }))}

        secondaryGunName={form.ffSecondaryGun}
        secondaryGunModel={form.ffSecondaryGunModel}
        onSecondaryGunNameChange={(val) => setForm((p) => ({ ...p, ffSecondaryGun: val }))}
        onSecondaryGunModelChange={(val) => setForm((p) => ({ ...p, ffSecondaryGunModel: val }))}
        secondaryGunModelUrl={form.ffSecondaryGunModelUrl}
        onSecondaryGunModelUrlChange={(val) => setForm((p) => ({ ...p, ffSecondaryGunModelUrl: val }))}
        secondaryGunScale={form.ffSecondaryGunScale}
        onSecondaryGunScaleChange={(val) => setForm((p) => ({ ...p, ffSecondaryGunScale: val }))}
        secondaryGunRotation={form.ffSecondaryGunRotation}
        onSecondaryGunRotationChange={(val) => setForm((p) => ({ ...p, ffSecondaryGunRotation: val }))}

        options={FREE_FIRE_GUN_OPTIONS}
        disabled={saving}
      />

      {/* SECTION 4 — SAVE BUTTON */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto font-bold tracking-wide shadow-lg shadow-orange-500/25"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : '💾 Save Landing Page Assets'}
        </Button>
      </div>
    </div>
  );
}
