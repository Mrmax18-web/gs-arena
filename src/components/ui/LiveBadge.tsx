export interface LiveBadgeProps {
  label?: string;
}

/** Compact live-style status indicator with a reduced-motion-aware pulse. */
export function LiveBadge({ label = "LIVE" }: LiveBadgeProps) {
  return (
    <span className="live-badge" title="Demo arena status">
      <span className="live-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
