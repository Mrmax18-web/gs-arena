import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';

export interface CreatorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorLoginModal: React.FC<CreatorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { grantCreatorPermissions } = useAuth();
  const { success, error } = useToast();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      error('Code Required', 'Please enter your master creator access code.');
      return;
    }

    setSubmitting(true);
    try {
      if (trimmed === '130620') {
        localStorage.setItem('gs_arena_creator', 'true');
        grantCreatorPermissions();
        success('Creator Access Granted', 'Your session has been elevated with Creator privileges.');
        setCode('');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        error('Elevation Failed', 'Incorrect authorization code.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Creator Verification"
      description="Enter the master creator authorization code to elevate your account session."
      maxWidth="sm"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="Master Access Code"
          type="password"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoFocus
          leftIcon="solar:key-bold"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            Verify Code
          </Button>
        </div>
      </form>
    </Modal>
  );
};
