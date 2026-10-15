import React from 'react';

/**
 * Global film grain texture overlay rendering an SVG feTurbulence noise filter.
 * Fixed across the entire viewport at z-index 1 (above ribbon, below interactive content)
 * with 3.5% opacity and overlay blend mode for Broadcast Noir cinematography.
 */
export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] select-none overflow-hidden"
      style={{
        opacity: 0.035,
        mixBlendMode: 'overlay',
      }}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <filter id="broadcast-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#broadcast-grain)" />
      </svg>
    </div>
  );
}
