import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Icon } from '@iconify/react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  details?: {
    wiped?: string[];
    preserved?: string[];
  };
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  requiredPhrase?: string; // If provided, user must type this exact phrase to confirm
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  requiredPhrase,
  loading = false,
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  const phraseMatches = !requiredPhrase || typedPhrase.trim() === requiredPhrase.trim();

  const handleConfirm = async () => {
    if (!phraseMatches) return;
    await onConfirm();
    setTypedPhrase('');
  };

  const handleClose = () => {
    setTypedPhrase('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="md"
      closeOnBackdropClick={variant !== 'danger' && !requiredPhrase}
    >
      <div className="space-y-4 text-left">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>

        {details && (
          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 p-3.5 text-xs">
            {details.wiped && details.wiped.length > 0 && (
              <div>
                <span className="font-semibold text-rose-500 flex items-center gap-1 mb-1">
                  <Icon icon="solar:trash-bin-trash-bold" /> What will be wiped:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  {details.wiped.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {details.preserved && details.preserved.length > 0 && (
              <div>
                <span className="font-semibold text-emerald-500 flex items-center gap-1 mb-1">
                  <Icon icon="solar:shield-check-bold" /> What will be preserved:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  {details.preserved.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {requiredPhrase && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Type <span className="font-mono font-bold text-rose-500 select-all">{requiredPhrase}</span> to confirm:
            </p>
            <Input
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={requiredPhrase}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
            disabled={!phraseMatches || loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
