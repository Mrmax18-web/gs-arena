import type { Branding } from '../types';

export const DEFAULT_BRANDING: Branding = {
  headerLogo: '/gs-arena-logo.png',
  headerLogoAlt: 'GS Arena',
  favicon: '/gs-arena-logo.png',
  bgmiIcon: '/bgmi-icon.png',
  freefireIcon: '/freefire-icon.png',
  landingBgmiBg: '/bgmi-icon.png',
  landingFFBg: '/freefire-icon.png',
  teamPlaceholder: '',
  playerPlaceholder: '',
  brandName: 'GS ARENA',
  brandSubtitle: 'Live Spectator Feed • Real-Time Standings',
  brandTagline: 'Unofficial Esports & Gaming Community',
  primaryColor: '#FF6B35',
  secondaryColor: '#FF2D2D',

  // Landing page logos
  landingBgmiLogo: '/bgmi-icon.png',
  landingFFLogo: '/freefire-icon.png',

  // 3D gun model assignments
  bgmiPrimaryGun: 'AWM',
  bgmiPrimaryGunModel: '/models/awm.glb',
  bgmiPrimaryGunModelUrl: '',
  bgmiPrimaryGunScale: 1,
  bgmiPrimaryGunRotation: 0,

  bgmiSecondaryGun: 'M416',
  bgmiSecondaryGunModel: '/models/m416.glb',
  bgmiSecondaryGunModelUrl: '',
  bgmiSecondaryGunScale: 1,
  bgmiSecondaryGunRotation: 0,

  ffPrimaryGun: 'MP40',
  ffPrimaryGunModel: '/models/mp40.glb',
  ffPrimaryGunModelUrl: '',
  ffPrimaryGunScale: 1,
  ffPrimaryGunRotation: 0,

  ffSecondaryGun: 'SCAR',
  ffSecondaryGunModel: '/models/scar.glb',
  ffSecondaryGunModelUrl: '',
  ffSecondaryGunScale: 1,
  ffSecondaryGunRotation: 0,

  customGunModels: {},

  // Wave Field background defaults
  waveSpeed: 74,
  waveHeight: 227,
  waveLength: 2690,
  waveColors: ['#FF6B35', '#00D9FF'],
  waveBackground: '#03040a',
  waveEnabled: true,

  // Additional background aliases
  backgroundEnabled: true,
  backgroundPreset: 'default',
  backgroundColors: ['#5A4AE0', '#F2D98A'],
  backgroundDensity: 75,
  backgroundDotSize: 8,
  backgroundWaveSpeed: 74,
  backgroundWaveHeight: 227,
  backgroundWaveLength: 2690,
  backgroundCameraHeight: 50,
  backgroundScatter: 108,
  backgroundTiltStart: 12,
  backgroundRollStart: 0,

  updatedAt: '',
  updatedBy: '',
};

export interface GunOption {
  value: string;
  label: string;
  defaultModel: string;
}

export const BGMI_GUN_OPTIONS: GunOption[] = [
  { value: 'AWM', label: 'AWM (Sniper)', defaultModel: '/models/awm.glb' },
  { value: 'M416', label: 'M416 (Assault Rifle)', defaultModel: '/models/m416.glb' },
  { value: 'AKM', label: 'AKM (Assault Rifle)', defaultModel: '/models/akm.glb' },
  { value: 'Groza', label: 'Groza (Assault Rifle)', defaultModel: '/models/groza.glb' },
  { value: 'Kar98k', label: 'Kar98k (Sniper)', defaultModel: '/models/kar98k.glb' },
  { value: 'Custom', label: 'Custom (.glb upload)', defaultModel: 'custom' },
];

export const FREE_FIRE_GUN_OPTIONS: GunOption[] = [
  { value: 'MP40', label: 'MP40 (SMG)', defaultModel: '/models/mp40.glb' },
  { value: 'SCAR', label: 'SCAR (Assault Rifle)', defaultModel: '/models/scar.glb' },
  { value: 'M1014', label: 'M1014 (Shotgun)', defaultModel: '/models/m1014.glb' },
  { value: 'UMP', label: 'UMP (SMG)', defaultModel: '/models/ump.glb' },
  { value: 'M14', label: 'M14 (Marksman Rifle)', defaultModel: '/models/m14.glb' },
  { value: 'Custom', label: 'Custom (.glb upload)', defaultModel: 'custom' },
];
