import React from 'react';
import { AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isProcessing = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal open={open} onClose={isProcessing ? () => {} : onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          {variant === 'danger' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          ) : variant === 'warning' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          ) : (
            <HelpCircle className="w-5 h-5 shrink-0 text-sky-400 mt-0.5" />
          )}
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            <span>{isProcessing ? 'Processing...' : confirmLabel}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
