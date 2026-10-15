import React, { useState, useEffect, useRef } from 'react';
import { Palette, Save, RotateCcw, AlertTriangle, Sparkles, Type } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useBranding, DEFAULT_BRANDING, saveLocalBranding, type Branding } from '../../hooks/useBranding';
import { ImageUploader } from './ImageUploader';
import { ConfirmModal } from '../ConfirmModal';

export function BrandingEditor() {
  const { branding, restoreDefaults } = useBranding();

  // Local working copy for editing before committing to Firestore
  const [formState, setFormState] = useState<Branding>(branding);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPayloadWarning, setShowPayloadWarning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Ref for timeout — ensures cleanup
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearSaveTimeout() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => clearSaveTimeout();
  }, []);

  // Sync initial branding when loaded
  useEffect(() => {
    setFormState(branding);
  }, [branding]);

  const handleChange = <K extends keyof Branding>(field: K, value: Branding[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveStatus(null);
  };

  // Calculate current payload size in KB
  const payloadSize = JSON.stringify(formState).length;
  const payloadKB = Math.round(payloadSize / 1024);

  async function handleSave(bypassWarning = false) {
    if (saving) return;

    console.log('[Branding] ▶ Save clicked');
    console.log('[Branding] Auth user:', auth.currentUser?.email);
    console.log('[Branding] Total payload size:', payloadKB, 'KB');

    // 1. Hard block if payload exceeds Firestore document limit (1 MB)
    if (payloadKB > 1000) {
      setSaveStatus({
        type: 'error',
        message: `❌ Payload too large (${payloadKB} KB). Firestore limit is 1000 KB. Please clear or use smaller images.`,
      });
      return;
    }

    // 2. Warn if payload is getting close to the limit (> 800 KB)
    if (payloadKB > 800 && !bypassWarning) {
      setShowPayloadWarning(true);
      return;
    }

    setSaving(true);
    setSaveStatus({ type: 'info', message: 'Saving branding configuration to Firestore...' });

    // 30-second hard safety timeout
    clearSaveTimeout();
    saveTimeoutRef.current = setTimeout(() => {
      console.error('[Branding] ⏰ TIMEOUT after 30s');
      setSaving(false);
      setSaveStatus({
        type: 'error',
        message: 'Save timed out after 30s. Try smaller images.',
      });
    }, 30000);

    // Save full snapshot locally right away as an immediate safety cache
    try {
      saveLocalBranding(formState);
      localStorage.setItem('branding-fallback', JSON.stringify(formState));
      console.log('[Branding] Saved to local cache as immediate safety fallback');
    } catch (localErr) {
      console.warn('[Branding] Could not cache to local storage:', localErr);
    }

    try {
      const ref = doc(db, 'config', 'branding');

      // STEP 1 — Save non-image metadata first (fast)
      const metaPayload = {
        brandName: formState.brandName || 'GS ARENA',
        brandSubtitle: formState.brandSubtitle || '',
        brandTagline: formState.brandTagline || '',
        primaryColor: formState.primaryColor || '#FF6B35',
        secondaryColor: formState.secondaryColor || '#FF2D2D',
        bgmiPrimaryGun: formState.bgmiPrimaryGun || 'AWM',
        bgmiPrimaryGunModel: formState.bgmiPrimaryGunModel || '/models/awm.glb',
        bgmiSecondaryGun: formState.bgmiSecondaryGun || 'M416',
        bgmiSecondaryGunModel: formState.bgmiSecondaryGunModel || '/models/m416.glb',
        ffPrimaryGun: formState.ffPrimaryGun || 'MP40',
        ffPrimaryGunModel: formState.ffPrimaryGunModel || '/models/mp40.glb',
        ffSecondaryGun: formState.ffSecondaryGun || 'SCAR',
        ffSecondaryGunModel: formState.ffSecondaryGunModel || '/models/scar.glb',
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'creator',
      };

      console.log('[Branding] Step 1: saving metadata...');
      setSaveStatus({ type: 'info', message: 'Step 1/2: Saving brand metadata...' });

      const metaPromise = setDoc(ref, metaPayload, { merge: true });
      const metaTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Step 1 metadata write timed out')), 30000)
      );

      await Promise.race([metaPromise, metaTimeout]);
      console.log('[Branding] Step 1 done');

      // STEP 2 — Save images (slower)
      const imagePayload = {
        headerLogo: formState.headerLogo || '',
        headerLogoAlt: formState.headerLogoAlt || '',
        favicon: formState.favicon || '',
        bgmiIcon: formState.bgmiIcon || '',
        freefireIcon: formState.freefireIcon || '',
        landingBgmiBg: formState.landingBgmiBg || '',
        landingFFBg: formState.landingFFBg || '',
        landingBgmiLogo: formState.landingBgmiLogo || formState.bgmiIcon || '/bgmi-icon.png',
        landingFFLogo: formState.landingFFLogo || formState.freefireIcon || '/freefire-icon.png',
        teamPlaceholder: formState.teamPlaceholder || '',
        playerPlaceholder: formState.playerPlaceholder || '',
        updatedAt: new Date().toISOString(),
      };

      console.log('[Branding] Step 2: saving images...');
      setSaveStatus({ type: 'info', message: 'Step 2/2: Saving compressed image assets...' });

      const imagePromise = setDoc(ref, imagePayload, { merge: true });
      const imageTimeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Firestore write timed out. Your images may be too large. Try compressing them further.'
              )
            ),
          30000
        )
      );

      await Promise.race([imagePromise, imageTimeout]);
      console.log('[Branding] Step 2 done');
      console.log('[Branding] ✅ Saved successfully');

      clearSaveTimeout();
      setSaving(false);
      setSaveStatus({
        type: 'success',
        message: '✅ Branding saved! All devices will update within 10 seconds.',
      });

      // Clear success notification after 6s
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      clearSaveTimeout();
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Branding] ❌ Save failed:', err);

      setSaving(false);

      let helpText =
        '⚠️ Could not save to Firestore, but changes are saved locally for this browser.\n' +
        'Error: ' + msg;

      if (msg.includes('timeout') || msg.includes('permission')) {
        helpText =
          'Could not save branding to cloud. Common causes:\n' +
          '• Your account is not in the admin/creator list\n' +
          '• Firestore rules block writes to /config/branding\n' +
          '• Internet connection timeout or payload size issue\n\n' +
          'Note: Changes have been preserved locally.\nError: ' + msg;
      }

      setSaveStatus({ type: 'error', message: helpText });
    } finally {
      clearSaveTimeout();
      setSaving(false);
    }
  }

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const executeReset = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await restoreDefaults();
      setFormState(DEFAULT_BRANDING);
      setShowResetConfirm(false);
      setSaveStatus({
        type: 'success',
        message: '✅ Branding reset to defaults.',
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: 'Failed to reset branding: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
      setShowResetConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Description header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-400" />
            <span>App Branding & Visual Assets</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload and customize logos, game icons, full-bleed backgrounds, and brand colors.
            Images are aggressively compressed to ensure instantaneous sync and stability.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Payload size indicator badge */}
          <div
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium flex items-center gap-1.5 ${
              payloadKB > 800
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : payloadKB > 400
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="Total size of branding assets stored in Firestore"
          >
            <span>Payload:</span>
            <strong>{payloadKB} KB</strong>
            <span className="text-slate-500">/ 1000 KB</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs text-white transition-all flex items-center gap-1.5 cursor-pointer ${
              saving
                ? 'bg-orange-500/60 cursor-wait'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 shadow-lg shadow-orange-500/20'
            }`}
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {saveStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : saveStatus.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              : 'bg-blue-500/20 border-blue-500/40 text-blue-200'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-xs font-medium">
            {saveStatus.message}
          </pre>
        </div>
      )}

      {/* Grid of Uploaders with distinct imageType configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. HEADER LOGO */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Header & Navigation Logo"
            description="Displayed on top navigation, spectator header, and sidebar."
            currentValue={formState.headerLogo}
            onChange={(val) => handleChange('headerLogo', val)}
            imageType="logo"
            previewSize={64}
            defaultFallback={DEFAULT_BRANDING.headerLogo}
          />
          <div className="pt-2">
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Logo Alt Text
            </label>
            <input
              type="text"
              value={formState.headerLogoAlt || ''}
              onChange={(e) => handleChange('headerLogoAlt', e.target.value)}
              placeholder="e.g. GS Arena"
              className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white"
            />
          </div>
        </div>

        {/* 2. FAVICON */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Favicon (Browser Tab Icon)"
            description="Appears in browser tabs and home screen bookmarks."
            currentValue={formState.favicon}
            onChange={(val) => handleChange('favicon', val)}
            imageType="favicon"
            previewSize={48}
            defaultFallback={DEFAULT_BRANDING.favicon}
          />
          <p className="text-[11px] text-slate-400 pt-2">
            Tip: 64x64 or 128x128 square image with transparency works best for tab icons.
          </p>
        </div>

        {/* 3. BGMI ICON */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="BGMI Game Icon"
            description="Used on game selection badges, tournament tags, and registration wizards."
            currentValue={formState.bgmiIcon}
            onChange={(val) => handleChange('bgmiIcon', val)}
            imageType="icon"
            previewSize={64}
            defaultFallback={DEFAULT_BRANDING.bgmiIcon}
          />
        </div>

        {/* 4. FREE FIRE ICON */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Free Fire Game Icon"
            description="Used on Free Fire badges, Clash Squad tournament cards, and tabs."
            currentValue={formState.freefireIcon}
            onChange={(val) => handleChange('freefireIcon', val)}
            imageType="icon"
            previewSize={64}
            defaultFallback={DEFAULT_BRANDING.freefireIcon}
          />
        </div>

        {/* 5. LANDING BGMI BACKGROUND */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Landing Page — BGMI Card Background"
            description="Poster artwork for the BGMI tournament card on the homepage."
            currentValue={formState.landingBgmiBg}
            onChange={(val) => handleChange('landingBgmiBg', val)}
            imageType="background"
            previewAspect="wide"
            defaultFallback={DEFAULT_BRANDING.landingBgmiBg}
          />
        </div>

        {/* 6. LANDING FREE FIRE BACKGROUND */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Landing Page — Free Fire Card Background"
            description="Poster artwork for the Free Fire tournament card on the homepage."
            currentValue={formState.landingFFBg}
            onChange={(val) => handleChange('landingFFBg', val)}
            imageType="background"
            previewAspect="wide"
            defaultFallback={DEFAULT_BRANDING.landingFFBg}
          />
        </div>

        {/* 7. TEAM LOGO PLACEHOLDER */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Team Logo Fallback Placeholder"
            description="Optional fallback image when a registered squad hasn't provided a custom crest."
            currentValue={formState.teamPlaceholder}
            onChange={(val) => handleChange('teamPlaceholder', val)}
            imageType="icon"
            previewSize={64}
          />
        </div>

        {/* 8. PLAYER AVATAR PLACEHOLDER */}
        <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <ImageUploader
            label="Player Avatar Fallback Placeholder"
            description="Optional fallback avatar for MVP leaderboards and player profile cards."
            currentValue={formState.playerPlaceholder}
            onChange={(val) => handleChange('playerPlaceholder', val)}
            imageType="icon"
            previewSize={64}
          />
        </div>
      </div>

      {/* Brand Text Section */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Type className="w-4 h-4 text-orange-400" />
          <span>Brand Typography & Titles</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={formState.brandName}
              onChange={(e) => handleChange('brandName', e.target.value)}
              placeholder="GS ARENA"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white font-black"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Displayed across headers and spectator views.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Subtitle Line
            </label>
            <input
              type="text"
              value={formState.brandSubtitle}
              onChange={(e) => handleChange('brandSubtitle', e.target.value)}
              placeholder="Live Spectator Feed • Real-Time Standings"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Subheader under main brand logo.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Community Tagline
            </label>
            <input
              type="text"
              value={formState.brandTagline}
              onChange={(e) => handleChange('brandTagline', e.target.value)}
              placeholder="Unofficial Esports & Gaming Community"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Sidebar and footer disclaimer.</span>
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-orange-400" />
          <span>Brand Colors & Accents</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
            <input
              type="color"
              value={formState.primaryColor || '#FF6B35'}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-200 block">
                Primary Brand Color
              </label>
              <input
                type="text"
                value={formState.primaryColor || '#FF6B35'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="w-28 mt-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-orange-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
            <input
              type="color"
              value={formState.secondaryColor || '#FF2D2D'}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-200 block">
                Secondary Brand Color
              </label>
              <input
                type="text"
                value={formState.secondaryColor || '#FF2D2D'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="w-28 mt-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Wave Field WebGL Animated Background Controls */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Scroll Wave Field Background (WebGL)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize 3D wave speed, amplitude height, wavelength frequency, and dual neon gradient colors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Wave Speed</span>
                <span className="font-mono text-cyan-400">{formState.waveSpeed ?? 74}</span>
              </div>
              <input
                type="range"
                min={20}
                max={350}
                value={formState.waveSpeed ?? 74}
                onChange={(e) => handleChange('waveSpeed', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Wave Height</span>
                <span className="font-mono text-orange-400">{formState.waveHeight ?? 227}</span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                value={formState.waveHeight ?? 227}
                onChange={(e) => handleChange('waveHeight', Number(e.target.value))}
                className="w-full accent-orange-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Wave Length</span>
                <span className="font-mono text-purple-400">{formState.waveLength ?? 2690}</span>
              </div>
              <input
                type="range"
                min={500}
                max={5000}
                step={50}
                value={formState.waveLength ?? 2690}
                onChange={(e) => handleChange('waveLength', Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="color"
                value={formState.waveColors?.[0] || formState.primaryColor || '#FF6B35'}
                onChange={(e) => {
                  const currentSecondary =
                    formState.waveColors?.[1] || formState.secondaryColor || '#00D9FF';
                  handleChange('waveColors', [e.target.value, currentSecondary]);
                }}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              />
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-200 block">
                  Wave Color 1 (Primary Crest)
                </label>
                <input
                  type="text"
                  value={formState.waveColors?.[0] || formState.primaryColor || '#FF6B35'}
                  onChange={(e) => {
                    const currentSecondary =
                      formState.waveColors?.[1] || formState.secondaryColor || '#00D9FF';
                    handleChange('waveColors', [e.target.value, currentSecondary]);
                  }}
                  className="w-28 mt-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-orange-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="color"
                value={formState.waveColors?.[1] || formState.secondaryColor || '#00D9FF'}
                onChange={(e) => {
                  const currentPrimary =
                    formState.waveColors?.[0] || formState.primaryColor || '#FF6B35';
                  handleChange('waveColors', [currentPrimary, e.target.value]);
                }}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              />
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-200 block">
                  Wave Color 2 (Secondary Glow)
                </label>
                <input
                  type="text"
                  value={formState.waveColors?.[1] || formState.secondaryColor || '#00D9FF'}
                  onChange={(e) => {
                    const currentPrimary =
                      formState.waveColors?.[0] || formState.primaryColor || '#FF6B35';
                    handleChange('waveColors', [currentPrimary, e.target.value]);
                  }}
                  className="w-28 mt-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Current total asset payload: <strong className="text-white font-mono">{payloadKB} KB</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Reset All to Defaults
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-white transition-all flex items-center gap-2 cursor-pointer ${
              saving
                ? 'bg-orange-500/60 cursor-wait'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 shadow-xl shadow-orange-500/25'
            }`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block mr-1" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>💾 Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payload Warning Confirmation Modal (> 800 KB) */}
      <ConfirmModal
        open={showPayloadWarning}
        title="⚠️ Large Image Payload Warning"
        message={`Total asset payload is ${payloadKB} KB. Firestore has a strict 1 MB per document limit. While saving in two steps helps, large payloads can result in timeout in constrained networks. Tip: Use smaller icons under 150 KB.\n\nDo you want to proceed with saving anyway?`}
        confirmLabel="Proceed with Save"
        cancelLabel="Optimize Images First"
        variant="warning"
        isProcessing={saving}
        onConfirm={() => {
          setShowPayloadWarning(false);
          handleSave(true);
        }}
        onClose={() => setShowPayloadWarning(false)}
      />

      {/* Reset Defaults Confirmation Modal */}
      <ConfirmModal
        open={showResetConfirm}
        title="Reset All Branding Defaults"
        message="Are you sure you want to reset all branding settings, logos, and custom color themes back to official GS Arena defaults? Any uploaded assets will be replaced with defaults."
        confirmLabel="Reset to Defaults"
        cancelLabel="Keep Custom Branding"
        variant="danger"
        isProcessing={saving}
        onConfirm={executeReset}
        onClose={() => {
          if (!saving) setShowResetConfirm(false);
        }}
      />
    </div>
  );
}
