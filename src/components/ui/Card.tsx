import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  showBrackets?: boolean;
}

/**
 * Glassmorphic container with esports corner brackets, ambient border glow,
 * and dynamic hover lift.
 */
export function Card({
  children,
  className,
  showBrackets = true,
  onClick,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4 } : undefined}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition-colors duration-200',
        'hover:border-white/20 hover:shadow-lg hover:shadow-black/50',
        onClick && 'cursor-pointer hover:border-accent-cyan/40 hover:shadow-[0_4px_24px_rgba(0,217,255,0.15)]',
        className,
      )}
      {...props}
    >
      {/* Corner Bracket L-shapes */}
      {showBrackets && (
        <>
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t-2 border-l-2 border-accent-cyan/40 transition-colors duration-200 group-hover:border-accent-cyan" />
          <span className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-t-2 border-r-2 border-white/20 transition-colors duration-200 group-hover:border-white/50" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 border-white/20 transition-colors duration-200 group-hover:border-white/50" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-bgmi-primary/40 transition-colors duration-200 group-hover:border-bgmi-primary" />
        </>
      )}

      {children}
    </motion.div>
  );
}
