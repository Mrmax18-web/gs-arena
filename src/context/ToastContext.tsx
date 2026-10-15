import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Trophy, Swords, AlertCircle, CheckCircle, Info, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export type ToastType = 'info' | 'success' | 'warning' | 'tournament' | 'bracket';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  timestamp: number;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id' | 'timestamp'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.duration ?? 6000;

      const newToast: ToastItem = {
        ...toast,
        id,
        timestamp: Date.now(),
        duration,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:top-4 sm:bottom-auto z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-white/10';
        let bgGradient = 'from-black/90 to-[#0e101f]/95';
        let icon = <Info className="w-4 h-4 text-blue-400 shrink-0" />;

        if (toast.type === 'tournament') {
          borderClass = 'border-amber-500/50 shadow-amber-500/20';
          bgGradient = 'from-[#140b03]/95 via-black/90 to-[#100702]/95';
          icon = <Trophy className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />;
        } else if (toast.type === 'bracket') {
          borderClass = 'border-orange-500/50 shadow-orange-500/20';
          bgGradient = 'from-[#160605]/95 via-black/90 to-[#0c0408]/95';
          icon = <Swords className="w-4 h-4 text-orange-400 shrink-0" />;
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 shadow-emerald-500/20';
          bgGradient = 'from-[#03150d]/95 via-black/90 to-[#031208]/95';
          icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-rose-500/40 shadow-rose-500/20';
          bgGradient = 'from-[#180406]/95 via-black/90 to-[#120305]/95';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto p-3.5 rounded-2xl border ${borderClass} bg-gradient-to-br ${bgGradient} backdrop-blur-xl shadow-2xl text-white transition-all transform animate-in slide-in-from-right-4 duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white truncate">
                    {toast.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-white/80 mt-1 leading-snug break-words">
                  {toast.message}
                </p>

                {toast.link && (
                  <Link
                    to={toast.link}
                    onClick={() => onDismiss(toast.id)}
                    className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-amber-300 transition-colors border border-white/10"
                  >
                    <span>{toast.linkText || 'View Live'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
