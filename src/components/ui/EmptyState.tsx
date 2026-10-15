import type { ReactNode } from 'react';
import { Shield, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Esports empty state container with glowing icon shield,
 * clean typography hierarchy, and optional call-to-action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) {
      return <Shield className="h-8 w-8 text-accent-cyan" />;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-8 w-8 text-accent-cyan" />;
    }
    return icon;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl',
        className,
      )}
    >
      {/* Corner Brackets */}
      <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-accent-cyan/40" />
      <span className="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-white/20" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-white/20" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-bgmi-primary/40" />

      {/* Icon Shield */}
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-accent-cyan shadow-[0_0_24px_rgba(0,217,255,0.2)]">
        {renderIcon()}
      </div>

      {/* Typography */}
      <h3 className="mb-2 font-orbitron text-lg font-bold uppercase tracking-wider text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="max-w-md font-sans text-sm text-slate-400">
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
