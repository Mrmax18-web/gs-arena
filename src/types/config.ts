export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface AppearanceConfig {
  bgmiIconUrl?: string;
  ffIconUrl?: string;
  arenaLogoUrl?: string;
  siteName?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemConfig {
  siteName: string;
  logos: {
    dark: string;
    light: string;
    mark?: string;
  };
  viewerBaseUrl: string;
  faqItems: FaqItem[];
  contactText: string;
  contactEmail: string;
  registrationEnabled: boolean;
  appearance?: AppearanceConfig;
}

export interface TwistRibbonAdvancedColors {
  goldColor?: string;
  highColor?: string;
  blueDeep?: string;
  blueHigh?: string;
  paleColor?: string;
  coolTint?: string;
}

export interface BackgroundConfig {
  enabled: boolean;
  background?: string;
  baseColor?: string;
  accentColor?: string;
  speed?: number;
  scale?: number;
  hover?: number;
  colorSplit?: number;
  ribbonGrain?: number;
  advanced?: TwistRibbonAdvancedColors & Record<string, unknown>;
  // Legacy / CSS fallback support
  colors: string[];
  density?: number;
  angle?: number;
  opacity: number;
}

