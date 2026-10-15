import { useState } from 'react';
import {
  Crosshair,
  Database,
  Globe,
  Mail,
  Palette,
  Shield,
  Upload,
  UserCheck,
  Waves,
  Zap,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useBranding, DEFAULT_BRANDING, type BrandingConfig } from '../hooks/useBranding';

export function CreatorPanelPage() {
  const { branding, saveBranding } = useBranding();
  const [activeSection, setActiveSection] = useState('branding');
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [weaponSkin, setWeaponSkin] = useState<string | null>(null);

  // Background state initialized from branding config
  const [bgConfig, setBgConfig] = useState<BrandingConfig>(branding);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep bgConfig in sync when branding loads
  useState(() => {
    setBgConfig(branding);
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBrandingLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWeaponUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setWeaponSkin(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (preset: 'default' | 'calm' | 'energetic') => {
    if (preset === 'default') {
      setBgConfig((prev) => ({
        ...prev,
        backgroundPreset: 'default',
        backgroundDensity: DEFAULT_BRANDING.backgroundDensity,
        backgroundDotSize: DEFAULT_BRANDING.backgroundDotSize,
        backgroundWaveSpeed: DEFAULT_BRANDING.backgroundWaveSpeed,
        backgroundWaveHeight: DEFAULT_BRANDING.backgroundWaveHeight,
        backgroundWaveLength: DEFAULT_BRANDING.backgroundWaveLength,
        backgroundCameraHeight: DEFAULT_BRANDING.backgroundCameraHeight,
        backgroundScatter: DEFAULT_BRANDING.backgroundScatter,
        backgroundTiltStart: DEFAULT_BRANDING.backgroundTiltStart,
        backgroundRollStart: DEFAULT_BRANDING.backgroundRollStart,
      }));
    } else if (preset === 'calm') {
      setBgConfig((prev) => ({
        ...prev,
        backgroundPreset: 'calm',
        backgroundDensity: 50,
        backgroundDotSize: 6,
        backgroundWaveSpeed: 40,
        backgroundWaveHeight: 150,
        backgroundWaveLength: 3000,
        backgroundCameraHeight: 40,
        backgroundScatter: 60,
      }));
    } else if (preset === 'energetic') {
      setBgConfig((prev) => ({
        ...prev,
        backgroundPreset: 'energetic',
        backgroundDensity: 150,
        backgroundDotSize: 12,
        backgroundWaveSpeed: 150,
        backgroundWaveHeight: 400,
        backgroundWaveLength: 1800,
        backgroundCameraHeight: 70,
        backgroundScatter: 200,
      }));
    }
  };

  const handleSaveBackground = async () => {
    try {
      await saveBranding(bgConfig);
      setSaveStatus({ type: 'success', message: '✅ Background saved to cloud' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('[Creator] Save failed:', err);
      setSaveStatus({ type: 'error', message: '❌ Save failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">
            ORGANIZATION CREATOR SUITE
          </span>
          <h1 className="mt-1 font-orbitron text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Creator Panel
          </h1>
          <p className="mt-1 font-rajdhani text-sm font-semibold uppercase tracking-wider text-slate-400">
            Organization owner controls, asset branding, weapon customization, and demo generator
          </p>
        </div>

        <Badge variant="purple" size="md">
          OWNER ROOT LEVEL
        </Badge>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 custom-scrollbar">
        {[
          { id: 'admins', label: 'Admin Management', icon: UserCheck },
          { id: 'branding', label: 'Branding & Theme', icon: Palette },
          { id: 'background', label: '🌊 Wave Background', icon: Waves },
          { id: 'guns', label: 'Weapons & 3D Assets', icon: Crosshair },
          { id: 'contact', label: 'Contact & Socials', icon: Mail },
          { id: 'viewer', label: 'Public Viewer', icon: Globe },
          { id: 'demo', label: 'Demo Data', icon: Database },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-rajdhani text-sm font-bold uppercase tracking-wider transition-all select-none ${
              activeSection === id
                ? 'border-accent-cyan/80 bg-accent-cyan/20 text-accent-cyan shadow-[0_0_16px_rgba(0,217,255,0.2)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ━━━ SECTION 1: ADMIN MANAGEMENT ━━━ */}
      {activeSection === 'admins' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Organizer & Admin Access
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Grant and revoke tournament management authority
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Grant Admin Access (Email)" placeholder="organizer@gsarena.gg" />
            <div className="flex items-end">
              <Button variant="primary" size="md">
                Authorize New Admin
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <span className="font-mono text-xs font-bold uppercase text-slate-400">
              Active Authorized Administrators
            </span>
            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5">
                <span className="font-semibold text-white">owner@gsarena.gg</span>
                <Badge variant="purple" size="sm">
                  SUPER ADMIN
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5">
                <span className="text-slate-300">dheer@gsarena.gg</span>
                <Badge variant="cyan" size="sm">
                  ORGANIZER
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ━━━ SECTION 2: BRANDING & THEME ━━━ */}
      {activeSection === 'branding' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Custom Organization Identity
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Upload custom esports crest and configure theme styling
            </p>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs font-bold uppercase text-slate-400">
              Tournament Logo Crest
            </label>
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition hover:border-accent-cyan/50">
              {brandingLogo ? (
                <div className="flex flex-col items-center">
                  <img
                    src={brandingLogo}
                    alt="Logo Preview"
                    className="h-28 w-28 rounded-2xl border border-white/20 object-cover shadow-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setBrandingLogo(null)}
                    className="mt-3 font-mono text-xs text-accent-red underline"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-mono text-xs text-slate-300">
                    Click to upload custom organization crest (PNG / SVG)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleLogoUpload}
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Primary Accent Color" defaultValue="#FF6B35" />
            <Input label="Secondary Glow Color" defaultValue="#00D9FF" />
          </div>

          <Button variant="primary" size="md">
            Save Brand Identity
          </Button>
        </Card>
      )}

      {/* ━━━ SECTION: WAVE BACKGROUND CONFIGURATION ━━━ */}
      {activeSection === 'background' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-orbitron text-lg font-bold uppercase text-white flex items-center gap-2">
                <Waves className="h-5 w-5 text-accent-cyan" />
                <span>Dynamic WebGL Wave Field</span>
              </h3>
              <p className="font-mono text-xs text-slate-400">
                Real-time GPU shader wave field with mouse warp harmonics and cinematic perspective
              </p>
            </div>
            {saveStatus && (
              <Badge variant={saveStatus.type === 'success' ? 'green' : 'red'} size="md">
                {saveStatus.message}
              </Badge>
            )}
          </div>

          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4">
            <div>
              <span className="font-orbitron text-sm font-bold uppercase text-white">
                Wave Background Status
              </span>
              <p className="font-mono text-xs text-slate-400">
                Enable live WebGL mesh wave or fall back to high-contrast starfield
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setBgConfig((prev) => ({ ...prev, backgroundEnabled: !prev.backgroundEnabled }))
              }
              className={`rounded-lg px-4 py-2 font-rajdhani text-xs font-bold uppercase tracking-wider transition ${
                bgConfig.backgroundEnabled
                  ? 'border border-accent-cyan/80 bg-accent-cyan/20 text-accent-cyan shadow-[0_0_16px_rgba(0,217,255,0.3)]'
                  : 'border border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {bgConfig.backgroundEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED'}
            </button>
          </div>

          {/* Presets */}
          <div>
            <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Harmonic Presets
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: 'default', label: 'Default Matrix' },
                { id: 'calm', label: 'Calm Flow' },
                { id: 'energetic', label: 'High Energy' },
                { id: 'custom', label: 'Custom' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id !== 'custom') applyPreset(id as 'default' | 'calm' | 'energetic');
                    else setBgConfig((p) => ({ ...p, backgroundPreset: 'custom' }));
                  }}
                  className={`rounded-xl border px-3 py-2 font-rajdhani text-xs font-bold uppercase tracking-wider transition ${
                    bgConfig.backgroundPreset === id
                      ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Mini Preview */}
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Interactive Shader Preview
              </span>
              <span className="font-mono text-[10px] text-accent-cyan">HOVER / MOVE MOUSE OVER WAVE</span>
            </div>
            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-[#03040a]">
            </div>
          </div>

          {/* Wave Settings Sliders */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <h4 className="font-orbitron text-xs font-bold uppercase tracking-wider text-accent-cyan">
              Wave Geometry & Dynamics
            </h4>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Density */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Density</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundDensity}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={bgConfig.backgroundDensity}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundDensity: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Dot Size */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Dot Size</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundDotSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={bgConfig.backgroundDotSize}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundDotSize: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Wave Speed */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Wave Speed</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundWaveSpeed}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={bgConfig.backgroundWaveSpeed}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundWaveSpeed: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Wave Height */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Wave Height</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundWaveHeight}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={bgConfig.backgroundWaveHeight}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundWaveHeight: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Wave Length */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Wave Length</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundWaveLength}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  value={bgConfig.backgroundWaveLength}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundWaveLength: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Camera Height */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Camera Height</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundCameraHeight}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgConfig.backgroundCameraHeight}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundCameraHeight: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Scatter */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Scatter</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundScatter}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={bgConfig.backgroundScatter}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundScatter: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Tilt Angle */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Tilt Angle</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundTiltStart}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={bgConfig.backgroundTiltStart}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundTiltStart: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>

              {/* Roll Angle */}
              <div>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-400">Roll Angle</span>
                  <span className="font-bold text-accent-cyan">{bgConfig.backgroundRollStart}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={bgConfig.backgroundRollStart}
                  onChange={(e) =>
                    setBgConfig((p) => ({ ...p, backgroundRollStart: Number(e.target.value) }))
                  }
                  className="w-full accent-accent-cyan"
                />
              </div>
            </div>
          </div>

          {/* Color Palette Controls */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
            <h4 className="font-orbitron text-xs font-bold uppercase tracking-wider text-accent-cyan">
              Wave Gradient Chromatics
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              {(bgConfig.backgroundColors || ['#5A4AE0', '#F2D98A']).map((color, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const updated = [...(bgConfig.backgroundColors || ['#5A4AE0', '#F2D98A'])];
                      updated[idx] = e.target.value;
                      setBgConfig((p) => ({ ...p, backgroundColors: updated }));
                    }}
                    className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs uppercase text-slate-300">{color}</span>
                  {(bgConfig.backgroundColors || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (bgConfig.backgroundColors || []).filter((_, i) => i !== idx);
                        setBgConfig((p) => ({ ...p, backgroundColors: updated }));
                      }}
                      className="ml-2 font-mono text-xs text-accent-red hover:underline"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {(bgConfig.backgroundColors || []).length < 8 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setBgConfig((p) => ({
                      ...p,
                      backgroundColors: [...(p.backgroundColors || ['#5A4AE0', '#F2D98A']), '#00D9FF'],
                    }))
                  }
                >
                  + Add Color
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="md" onClick={handleSaveBackground}>
              Save Background
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setBgConfig(DEFAULT_BRANDING);
                saveBranding(DEFAULT_BRANDING);
              }}
            >
              Reset to Default
            </Button>
          </div>
        </Card>
      )}

      {/* ━━━ SECTION 3: WEAPONS & 3D ASSETS ━━━ */}
      {activeSection === 'guns' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Weapon Holograms & 3D Assets
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Configure floating weapons and arena character emblems
            </p>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs font-bold uppercase text-slate-400">
              Holographic Weapon Skin Texture
            </label>
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition hover:border-bgmi-primary/50">
              {weaponSkin ? (
                <div className="flex flex-col items-center">
                  <img
                    src={weaponSkin}
                    alt="Weapon Skin"
                    className="h-28 w-28 rounded-2xl border border-white/20 object-cover shadow-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setWeaponSkin(null)}
                    className="mt-3 font-mono text-xs text-accent-red underline"
                  >
                    Reset Texture
                  </button>
                </div>
              ) : (
                <>
                  <Crosshair className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-mono text-xs text-slate-300">
                    Upload GLTF / PNG Weapon Skin texture
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleWeaponUpload}
                  />
                </>
              )}
            </div>
          </div>

          <Button variant="primary" size="md">
            Update 3D Assets
          </Button>
        </Card>
      )}

      {/* ━━━ SECTION 4: CONTACT & SUPPORT ━━━ */}
      {activeSection === 'contact' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Communication Channels
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Links shown to squads and spectators
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Discord Community Link" defaultValue="https://discord.gg/gsarena" />
            <Input label="WhatsApp Support Group" defaultValue="https://chat.whatsapp.com/sample" />
            <Input label="Support Email" defaultValue="support@gsarena.gg" />
            <Input label="Official YouTube Stream" defaultValue="https://youtube.com/@gsarena" />
          </div>

          <Button variant="primary" size="md">
            Save Support Channels
          </Button>
        </Card>
      )}

      {/* ━━━ SECTION 5: PUBLIC VIEWER ━━━ */}
      {activeSection === 'viewer' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Public Viewer Portal
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Spectator portal without administration controls
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-rajdhani text-sm font-bold uppercase text-white">
                  Public Spectator URL
                </div>
                <div className="font-mono text-xs text-accent-cyan">
                  https://gsarena.gg/viewer
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText('https://gsarena.gg/viewer');
                  alert('Copied spectator URL to clipboard.');
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ━━━ SECTION 6: DEMO DATA ━━━ */}
      {activeSection === 'demo' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-orbitron text-lg font-bold uppercase text-white">
              Demo Sandbox Generator
            </h3>
            <p className="font-mono text-xs text-slate-400">
              Generate dummy squads and test match results
            </p>
          </div>

          <p className="font-sans text-sm text-slate-300">
            Inject mock squads (Soul, GodLike, TeamIND, 8Bit) and randomized match placements to test
            leaderboard calculations and 3D podiums.
          </p>

          <Button
            variant="secondary"
            size="md"
            onClick={() => alert('Demo squads and match scores populated successfully!')}
          >
            <Zap className="h-4 w-4 text-accent-amber" />
            <span>Seed 16 Demo Squads</span>
          </Button>
        </Card>
      )}
    </div>
  );
}
