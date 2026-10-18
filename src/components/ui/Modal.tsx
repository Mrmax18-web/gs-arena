import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '@iconify/react';

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback invoked when the modal requests closure */
  onClose: () => void;
  /** Accessible dialog title */
  title?: string;
  /** Accessible dialog description */
  description?: string;
  /** Content rendered inside the dialog */
  children: React.ReactNode;
  /** Maximum width container breakpoint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether clicking the backdrop closes the modal (default true, false for destructive dialogs) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal (default true) */
  closeOnEscape?: boolean;
  /** Whether to show the top-right close icon button */
  showCloseButton?: boolean;
}

/**
 * Modal implements the cognitive UX Figure and Ground law.
 *
 * It provides an unmistakable visual hierarchy:
 * - A heavy, deep dark backdrop (bg-black/75 with backdrop-blur-md) suppresses ground clutter.
 * - The dialog surface is elevated as the single high-contrast figure on the screen.
 * - Locks body scroll, traps keyboard focus, handles Escape, and supports backdrop dismiss
 *   (which can be disabled for critical/destructive actions).
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    // 1. Save previously focused element to restore on close
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // 2. Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Keyboard handling (Escape & Focus Trap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 4. Focus first focusable element inside modal after open
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const backdropAnim = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1 };

  const dialogAnim = shouldReduceMotion
    ? { opacity: 1, scale: 1, y: 0 }
    : { opacity: 1, scale: 1, y: 0 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop (Figure and Ground: bg-black/75 + backdrop-blur-md) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={backdropAnim}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={dialogAnim}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} glass-strong rounded-2xl p-6 shadow-2xl border border-white/20 dark:border-white/20 z-10 my-8`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {title && (
                    <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id="modal-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Icon icon="solar:close-circle-bold" className="text-xl" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
