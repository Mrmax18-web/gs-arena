import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: Array<SelectOption | string>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Custom glassmorphic esports dropdown with keyboard navigation,
 * custom option panel, and indicator animations.
 */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder,
  className,
  disabled = false,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400 select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'relative flex h-11 w-full items-center justify-between rounded-xl border bg-black/40 px-3.5 text-left text-sm cursor-pointer',
          'transition-all duration-200 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen
            ? 'border-accent-cyan/80 ring-2 ring-accent-cyan/25 shadow-[0_0_16px_rgba(0,217,255,0.2)]'
            : 'border-white/10 hover:border-white/20',
          selectedOption ? 'text-slate-100 font-medium' : 'text-slate-500',
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
        </span>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-accent-cyan',
          )}
        />
      </button>

      {/* Glassmorphic Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="listbox"
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-white/15 bg-[#0a0a14]/95 p-1.5 shadow-2xl backdrop-blur-2xl custom-scrollbar"
          >
            {placeholder && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-mono tracking-wide text-left transition-colors cursor-pointer',
                  value === ''
                    ? 'bg-white/10 text-accent-cyan font-bold'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                <span>{placeholder}</span>
                {value === '' && <Check className="h-3.5 w-3.5 text-accent-cyan" />}
              </button>
            )}

            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-accent-cyan/15 text-accent-cyan font-semibold border border-accent-cyan/30'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-accent-cyan ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
