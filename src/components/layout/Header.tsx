import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../hooks/useBranding';

export interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { branding } = useBranding();
  const [imgError, setImgError] = useState(false);

  // Reset img error if branding logo is updated
  useEffect(() => {
    setImgError(false);
  }, [branding.headerLogo]);

  const brandName = branding.brandName || 'GS ARENA';
  const logoAlt = branding.headerLogoAlt || brandName;
  const logoSrc = branding.headerLogo || '/gs-arena-logo.png';
  const subtitle = branding.brandSubtitle || 'Live Spectator Feed • Real-Time Standings';

  // Extract initials for fallback
  const initials = brandName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'GS';

  return (
    <header role="banner" className="flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-orange-500/20 bg-black/40 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2.5 sm:gap-4 min-w-0 group" title={brandName}>
        {/* GS Arena / Custom Logo */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
          {!imgError ? (
            <img
              src={logoSrc}
              alt={logoAlt}
              onError={() => setImgError(true)}
              className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-contain bg-black/60 p-1 border border-orange-500/30 logo-glow"
            />
          ) : (
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 p-0.5 border border-orange-500/40 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <div className="w-full h-full rounded-[10px] bg-black/80 flex items-center justify-center">
                <span className="text-white font-black font-['Teko',sans-serif] text-xl sm:text-2xl tracking-wider">
                  {initials}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Brand Text */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-['Teko',sans-serif] tracking-tight leading-none uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-[0_0_12px_rgba(255,107,53,0.3)] truncate">
            {brandName}
          </h2>
          <p className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-white/60 mt-0.5 sm:mt-1 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
      </Link>

      {children && (
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
