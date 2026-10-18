import React, { useState } from 'react';
import { AdminRequest } from '../../types/auth';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

interface AdminApprovalsTabProps {
  requests: AdminRequest[];
  onRefresh?: () => void;
}

export const AdminApprovalsTab: React.FC<AdminApprovalsTabProps> = ({
  requests = [],
  onRefresh,
}) => {
  const { success, error } = useToast();
  const [selectedReq, setSelectedReq] = useState<AdminRequest | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openConfirm = (req: AdminRequest, action: 'approve' | 'reject') => {
    setSelectedReq(req);
    setDecision(action);
    setConfirmOpen(true);
  };

  const handleExecuteReview = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      // Mock function replacement
      setTimeout(() => {
        success(
          decision === 'approve' ? 'Admin Approved' : 'Admin Request Rejected',
          `Successfully processed request for ${selectedReq.name}. (Mock)`
        );
        if (onRefresh) onRefresh();
        setSubmitting(false);
        setConfirmOpen(false);
      }, 800);
    } catch (err: any) {
      error('Review Error', err?.message || 'Failed to review request.');
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  if (requests.length === 0) {
    return (
      <GlassCard className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
        No pending administrator applications.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-slate-200 dark:border-white/10 pb-3">
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          Pending Administrator Applications
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review candidates applying for referee and tournament administration privileges.
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <GlassCard
            key={req.uid}
            className="p-5 border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {req.name}
                </span>
                <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                  {req.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Email: <strong className="text-slate-700 dark:text-slate-300 font-mono">{req.email}</strong></span>
                <span>Contact: <strong className="text-slate-700 dark:text-slate-300">{req.contact}</strong></span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-black/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5 mt-2">
                &ldquo;{req.reason}&rdquo;
              </p>
            </div>

            {req.status === 'pending' && (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openConfirm(req, 'reject')}
                  icon="solar:close-circle-bold"
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openConfirm(req, 'approve')}
                  icon="solar:shield-check-bold"
                >
                  Approve Admin
                </Button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecuteReview}
        title={decision === 'approve' ? 'Approve Admin Privileges' : 'Reject Admin Request'}
        message={`Are you sure you want to ${decision} administrator privileges for ${selectedReq?.name} (${selectedReq?.email})?`}
        confirmText={decision === 'approve' ? 'Approve' : 'Reject'}
        variant={decision === 'approve' ? 'primary' : 'danger'}
        loading={submitting}
      />
    </div>
  );
};