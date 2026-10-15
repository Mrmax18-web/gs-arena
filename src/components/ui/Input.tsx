import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

/**
 * Technical esports input field with dark backdrop, JetBrains Mono label,
 * glowing focus borders, error status, and success validation check.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, success, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400 select-none"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-11 w-full rounded-xl border bg-black/40 px-3.5 text-sm text-slate-100 placeholder:text-slate-500',
            'transition-all duration-200 focus:outline-none',
            error
              ? 'border-accent-red/70 focus:border-accent-red focus:ring-2 focus:ring-accent-red/25 focus:shadow-[0_0_16px_rgba(239,68,68,0.25)]'
              : success
                ? 'border-accent-green/70 pr-10 focus:border-accent-green focus:ring-2 focus:ring-accent-green/25'
                : 'border-white/10 hover:border-white/20 focus:border-accent-cyan/80 focus:ring-2 focus:ring-accent-cyan/25 focus:shadow-[0_0_16px_rgba(0,217,255,0.2)]',
            className,
          )}
          {...rest}
        />
        {error && (
          <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-red" />
        )}
        {!error && success && (
          <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-green" />
        )}
      </div>
      {error && (
        <p className="mt-1.5 font-sans text-xs font-medium text-accent-red flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
});
