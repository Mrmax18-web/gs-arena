import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'relative bg-gradient-to-r from-bgmi-primary via-[#ff5030] to-ff-primary text-white font-rajdhani tracking-wider uppercase font-bold shadow-md shadow-orange-950/40 hover:shadow-[0_0_28px_rgba(255,107,53,0.55)] hover:brightness-110 border border-white/20 active:scale-[0.98]',
  secondary:
    'bg-white/[0.08] text-slate-100 font-rajdhani tracking-wider uppercase font-semibold border border-white/15 hover:bg-white/[0.14] hover:border-white/30 backdrop-blur-md active:scale-[0.98]',
  ghost:
    'bg-transparent text-slate-300 font-rajdhani tracking-wider uppercase font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.98]',
  danger:
    'bg-accent-red/90 text-white font-rajdhani tracking-wider uppercase font-bold border border-red-500/40 hover:bg-accent-red hover:shadow-[0_0_24px_rgba(239,68,68,0.5)] active:scale-[0.98]',
  success:
    'bg-accent-green/90 text-white font-rajdhani tracking-wider uppercase font-bold border border-emerald-500/40 hover:bg-accent-green hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] active:scale-[0.98]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

/**
 * Elite esports button with high-contrast variants, subtle corner accents,
 * loading indicator, and tactile press response.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'group relative inline-flex items-center justify-center select-none overflow-hidden transition-all duration-200 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03040a]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {/* Corner bracket accents on primary button */}
      {variant === 'primary' && !disabled && (
        <>
          <span className="pointer-events-none absolute top-0 left-0 h-1.5 w-1.5 border-t-2 border-l-2 border-white/60 transition-transform group-hover:scale-125" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-1.5 w-1.5 border-b-2 border-r-2 border-white/60 transition-transform group-hover:scale-125" />
        </>
      )}

      {loading && <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});
