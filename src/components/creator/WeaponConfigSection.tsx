import React from 'react';
import { GunModelPicker } from './GunModelPicker';
import type { GunOption } from '../../lib/brandingDefaults';

export interface WeaponConfigSectionProps {
  panelTitle: string;
  accent: 'orange' | 'red';
  primaryGunName: string;
  primaryGunModel: string;
  onPrimaryGunNameChange: (val: string) => void;
  onPrimaryGunModelChange: (val: string) => void;
  primaryGunModelUrl?: string;
  onPrimaryGunModelUrlChange?: (val: string) => void;
  primaryGunScale?: number;
  onPrimaryGunScaleChange?: (val: number) => void;
  primaryGunRotation?: number;
  onPrimaryGunRotationChange?: (val: number) => void;

  secondaryGunName: string;
  secondaryGunModel: string;
  onSecondaryGunNameChange: (val: string) => void;
  onSecondaryGunModelChange: (val: string) => void;
  secondaryGunModelUrl?: string;
  onSecondaryGunModelUrlChange?: (val: string) => void;
  secondaryGunScale?: number;
  onSecondaryGunScaleChange?: (val: number) => void;
  secondaryGunRotation?: number;
  onSecondaryGunRotationChange?: (val: number) => void;

  options: GunOption[];
  disabled?: boolean;
}

export function WeaponConfigSection({
  panelTitle,
  accent,
  primaryGunName,
  primaryGunModel,
  onPrimaryGunNameChange,
  onPrimaryGunModelChange,
  primaryGunModelUrl,
  onPrimaryGunModelUrlChange,
  primaryGunScale = 1,
  onPrimaryGunScaleChange,
  primaryGunRotation = 0,
  onPrimaryGunRotationChange,

  secondaryGunName,
  secondaryGunModel,
  onSecondaryGunNameChange,
  onSecondaryGunModelChange,
  secondaryGunModelUrl,
  onSecondaryGunModelUrlChange,
  secondaryGunScale = 1,
  onSecondaryGunScaleChange,
  secondaryGunRotation = 0,
  onSecondaryGunRotationChange,

  options,
  disabled = false,
}: WeaponConfigSectionProps) {
  const accentBorder = accent === 'orange' ? 'border-orange-500/30' : 'border-rose-500/30';
  const accentBg = accent === 'orange' ? 'bg-orange-500/[0.03]' : 'bg-rose-500/[0.03]';
  const titleColor = accent === 'orange' ? 'text-orange-400' : 'text-rose-400';

  return (
    <div className={`p-4 sm:p-5 rounded-xl border ${accentBorder} ${accentBg} space-y-4`}>
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h4 className={`text-sm sm:text-base font-bold font-['Teko',sans-serif] text-xl tracking-wide uppercase ${titleColor}`}>
          {panelTitle}
        </h4>
        <span className="text-[10px] font-mono uppercase text-gray-400">
          Hero & Quick-Switch Arsenal
        </span>
      </div>

      <div className="space-y-3">
        <GunModelPicker
          label="Primary Gun (Hero 3D Model)"
          gunName={primaryGunName}
          onGunNameChange={onPrimaryGunNameChange}
          modelPath={primaryGunModel}
          onModelPathChange={onPrimaryGunModelChange}
          modelUrl={primaryGunModelUrl}
          onModelUrlChange={onPrimaryGunModelUrlChange}
          scale={primaryGunScale}
          onScaleChange={onPrimaryGunScaleChange}
          rotation={primaryGunRotation}
          onRotationChange={onPrimaryGunRotationChange}
          options={options}
          disabled={disabled}
        />

        <GunModelPicker
          label="Secondary Gun (Switch Option)"
          gunName={secondaryGunName}
          onGunNameChange={onSecondaryGunNameChange}
          modelPath={secondaryGunModel}
          onModelPathChange={onSecondaryGunModelChange}
          modelUrl={secondaryGunModelUrl}
          onModelUrlChange={onSecondaryGunModelUrlChange}
          scale={secondaryGunScale}
          onScaleChange={onSecondaryGunScaleChange}
          rotation={secondaryGunRotation}
          onRotationChange={onSecondaryGunRotationChange}
          options={options}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
