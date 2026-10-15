import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Premium esports modal dialog with heavy backdrop blur,
 * spring-based scale entrance, tech corner brackets, and keyboard ESC closure.
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Heavy blur backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-white/15 bg-[#0a0a14]/90 p-6 shadow-2xl backdrop-blur-2xl custom-scrollbar",
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Tech Corner Brackets */}
            <span className="pointer-events-none absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-accent-cyan/60 rounded-tl-[24px]" />
            <span className="pointer-events-none absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-white/30 rounded-tr-[24px]" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-white/30 rounded-bl-[24px]" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-bgmi-primary/60 rounded-br-[24px]" />

            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              {title ? (
                <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-100">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg border border-white/10 bg-white/[0.05] p-1.5 text-slate-400 transition-colors hover:border-white/20 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
