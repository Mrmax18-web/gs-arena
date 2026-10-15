import React from "react";
import { Link } from "react-router-dom";
import { Settings, Shield } from "lucide-react";

export interface HudBarProps {
  spectators?: number;
  muted?: boolean;
  onToggleMute?: () => void;
  onOpenSettings?: () => void;
  brandName?: string;
  brandSubtitle?: string;
  logoUrl?: string;
}

/** Clean HUD header showing arena branding on left and settings gear on right. */
export function HudBar({
  onOpenSettings,
  brandName = "GS ARENA",
  brandSubtitle = "BUILT FOR THE LAST SQUAD",
  logoUrl,
}: HudBarProps) {
  return (
    <header className="hud-bar flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5">
      {/* Brand & Subtitle (Left side) */}
      <div className="brand flex items-center gap-2.5 sm:gap-3" aria-label={`${brandName}, competitive gaming`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brandName}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain bg-black/60 p-0.5 border border-orange-500/30"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <span className="brand-mark flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400" aria-hidden="true">
            <Shield size={20} strokeWidth={1.8} />
          </span>
        )}
        <div>
          <div className="brand-name font-black font-['Teko',sans-serif] text-xl sm:text-2xl tracking-wide uppercase text-white leading-none">
            {brandName}
          </div>
          <div className="brand-subtitle text-[10px] sm:text-xs font-mono uppercase tracking-widest text-orange-400/90 font-semibold">
            {brandSubtitle}
          </div>
        </div>
      </div>

      {/* Settings Gear Icon (Right side) */}
      <div className="hud-actions flex items-center">
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="icon-button p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-orange-500/10"
            aria-label="Open settings and admin authentication"
            title="Admin & Settings"
          >
            <Settings size={18} />
          </button>
        ) : (
          <Link
            to="/login"
            className="icon-button p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-orange-500/10"
            aria-label="Admin & Settings"
            title="Admin & Settings"
          >
            <Settings size={18} />
          </Link>
        )}
      </div>
    </header>
  );
}

export default HudBar;
