import React from 'react';
import { Icon } from '@iconify/react';

export interface InlineNoticeProps {
  /** Type of notice: 'warning' (amber) or 'error' (muted red) or 'info' */
  variant?: 'warning' | 'error' | 'info';
  /** Text message or node to display */
  children: React.ReactNode;
  /** Optional action or button (e.g. Undo, Retry) */
  action?: React.ReactNode;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional icon override */
  icon?: string;
}

/**
 * InlineNotice implements the cognitive UX Banner Blindness law.
 *
 * Avoids giant aggressive block banners that users reflexively ignore like ads.
 * Instead, provides a compact, quiet, highly contextual inline element placed directly
 * beside the relevant input or action:
 * - Amber icon for warnings with role="status"
 * - Muted red accent for true errors with role="alert"
 * - Glass background with a subtle 2px left border
 * - No distracting looping or flashing animations
 */
export const InlineNotice: React.FC<InlineNoticeProps> = ({
  variant = 'warning',
  children,
  action,
  className = '',
  icon,
}) => {
  const isError = variant === 'error';
  const role = isError ? 'alert' : 'status';

  const defaultIcon = isError
    ? 'solar:danger-triangle-bold'
    : variant === 'info'
    ? 'solar:info-circle-bold'
    : 'solar:shield-warning-bold';

  const iconName = icon || defaultIcon;

  const colorStyles = isError
    ? 'border-l-2 border-red-500 bg-red-500/10 text-red-200'
    : variant === 'info'
    ? 'border-l-2 border-sky-500 bg-sky-500/10 text-sky-200'
    : 'border-l-2 border-amber-500 bg-amber-500/10 text-amber-200';

  const iconColor = isError
    ? 'text-red-400'
    : variant === 'info'
    ? 'text-sky-400'
    : 'text-amber-400';

  return (
    <div
      role={role}
      className={`glass rounded-r-xl px-3 py-2 text-xs backdrop-blur-md flex items-center justify-between gap-2.5 transition-colors ${colorStyles} ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon icon={iconName} className={`text-base shrink-0 ${iconColor}`} aria-hidden="true" />
        <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed truncate">
          {children}
        </span>
      </div>
      {action && <div className="shrink-0 text-xs font-semibold">{action}</div>}
    </div>
  );
};
