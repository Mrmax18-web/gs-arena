import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Registration, ApprovalStatus, PaymentStatus } from '../../types/registration';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { reviewApproval, reviewPayment } from '../../services/registrationService';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '@iconify/react';

interface RegistrationReviewProps {
  registrations: Registration[];
  tournamentName?: string;
  onReviewed?: () => void;
}

export const RegistrationReview: React.FC<RegistrationReviewProps> = ({
  registrations = [],
  tournamentName = 'Tournament',
  onReviewed,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeReg, setActiveReg] = useState<Registration | null>(null);
  const [reviewType, setReviewType] = useState<'approval' | 'payment'>('approval');
  const [approvalDecision, setApprovalDecision] = useState<ApprovalStatus>('approved');
  const [paymentDecision, setPaymentDecision] = useState<PaymentStatus>('verified');
  const [reviewNote, setReviewNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Open modal for squad approval review
  const openApprovalModal = (reg: Registration, action: ApprovalStatus) => {
    setActiveReg(reg);
    setReviewType('approval');
    setApprovalDecision(action);
    setReviewNote('');
    setModalOpen(true);
  };

  // Open modal for payment review
  const openPaymentModal = (reg: Registration, action: PaymentStatus) => {
    setActiveReg(reg);
    setReviewType('payment');
    setPaymentDecision(action);
    setReviewNote('');
    setModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!activeReg || !user) return;

    setSubmitting(true);
    try {
      if (reviewType === 'approval') {
        await reviewApproval(activeReg.id, approvalDecision, user.uid, reviewNote.trim());
        success(
          approvalDecision === 'approved' ? 'Squad Approved' : 'Squad Rejected',
          `Team "${activeReg.teamName}" approval status set to ${approvalDecision}.`
        );
      } else {
        await reviewPayment(activeReg.id, paymentDecision, user.uid, reviewNote.trim());
        success(
          paymentDecision === 'verified' ? 'Payment Verified' : 'Payment Rejected',
          `Team "${activeReg.teamName}" payment status set to ${paymentDecision}.`
        );
      }
      setModalOpen(false);
      if (onReviewed) onReviewed();
    } catch (err: any) {
      error('Review Failed', err?.message || 'Could not update review status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to Excel with Teams and Players sheets, OTR as text, NO phones or screenshots
  const handleExportExcel = () => {
    if (registrations.length === 0) {
      error('No Data', 'There are no registrations to export.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Teams
      const teamsData = registrations.map((r) => ({
        'Team Name': r.teamName,
        'Leader Email': r.leaderEmail,
        'OTR (Transaction Reference)': r.otr ? String(r.otr) : 'N/A',
        'Payment Status': (r.paymentStatus || 'pending').toUpperCase(),
        'Squad Approval Status': (r.approvalStatus || r.status || 'pending').toUpperCase(),
        'Submitted At': r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
        'Payment Note': r.paymentReviewNote || '',
        'Squad Note': r.reviewNote || '',
      }));

      const teamsWs = XLSX.utils.json_to_sheet(teamsData);

      // Force OTR column to be treated as text to avoid truncation / scientific notation
      const range = XLSX.utils.decode_range(teamsWs['!ref'] || 'A1');
      for (let R = 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 2 }); // Column C is OTR
        if (teamsWs[cellAddress]) {
          teamsWs[cellAddress].t = 's'; // string type
        }
      }

      XLSX.utils.book_append_sheet(wb, teamsWs, 'Teams');

      // Sheet 2: Players
      const playersData: Array<{
        'Team Name': string;
        'Player Slot': number;
        'In-Game ID': string;
        'Tournament ID': string;
        'Payment Status': string;
        'Approval Status': string;
      }> = [];

      registrations.forEach((r) => {
        (r.players || []).forEach((player, idx) => {
          playersData.push({
            'Team Name': r.teamName,
            'Player Slot': idx + 1,
            'In-Game ID': player,
            'Tournament ID': r.tournamentId,
            'Payment Status': (r.paymentStatus || 'pending').toUpperCase(),
            'Approval Status': (r.approvalStatus || r.status || 'pending').toUpperCase(),
          });
        });
      });

      const playersWs = XLSX.utils.json_to_sheet(playersData);
      XLSX.utils.book_append_sheet(wb, playersWs, 'Players');

      const sanitizedName = tournamentName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedName}_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;

      XLSX.writeFile(wb, filename);
      success('Export Complete', `Downloaded ${filename}`);
    } catch (err: any) {
      error('Export Failed', err?.message || 'Could not generate Excel spreadsheet.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Squad Registrations ({registrations.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify payment transaction receipts (OTR) and review team eligibility separately.
          </p>
        </div>

        <Button
          variant="glass"
          size="sm"
          onClick={handleExportExcel}
          icon="solar:document-medicine-bold"
          disabled={registrations.length === 0}
        >
          Export to Excel (.xlsx)
        </Button>
      </div>

      {registrations.length === 0 ? (
        <GlassCard className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
          No team registrations submitted for this tournament yet.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const currentApproval = reg.approvalStatus || reg.status || 'pending';
            const currentPayment = reg.paymentStatus || 'pending';

            return (
              <GlassCard
                key={reg.id}
                className="p-5 text-left border-slate-200 dark:border-white/10 hover:border-brand-500/30 transition-all space-y-4"
              >
                {/* Top Row: Team info & Current Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    {reg.teamLogoUrl ? (
                      <img
                        src={reg.teamLogoUrl}
                        alt={reg.teamName}
                        className="h-10 w-10 rounded-xl object-contain bg-black/20 p-1 border border-slate-300 dark:border-white/10"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-sm">
                        {reg.teamName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {reg.teamName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          &bull; {new Date(reg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {reg.leaderEmail}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Payment:</span>
                      <Badge
                        variant={
                          currentPayment === 'verified'
                            ? 'success'
                            : currentPayment === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {currentPayment.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Squad:</span>
                      <Badge
                        variant={
                          currentApproval === 'approved'
                            ? 'success'
                            : currentApproval === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {currentApproval.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Roster, OTR, Payment Screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Players Roster */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Roster Players (4)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(reg.players || []).map((p, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-xs font-mono text-slate-800 dark:text-slate-200 truncate"
                        >
                          <span className="text-slate-400 text-[10px] mr-1">#{idx + 1}</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OTR and Audit */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Transaction Info (OTR)
                    </span>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1">
                      <div className="text-xs">
                        <span className="text-slate-400 text-[10px] block">OTR Reference:</span>
                        <span className="font-mono font-bold text-amber-500 select-all">
                          {reg.otr || 'N/A'}
                        </span>
                      </div>
                      {reg.paymentReviewNote && (
                        <p className="text-[11px] text-slate-400 italic">
                          Payment Note: {reg.paymentReviewNote}
                        </p>
                      )}
                      {reg.reviewNote && (
                        <p className="text-[11px] text-slate-400 italic">
                          Squad Note: {reg.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Payment Screenshot Proof
                    </span>
                    {reg.paymentScreenshotUrl ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={reg.paymentScreenshotUrl}
                          alt="Receipt"
                          className="h-16 w-20 rounded-lg object-cover border border-slate-300 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setScreenshotModalUrl(reg.paymentScreenshotUrl)}
                        />
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setScreenshotModalUrl(reg.paymentScreenshotUrl)}
                            className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
                          >
                            <Icon icon="solar:eye-bold" /> View Proof
                          </button>
                          <a
                            href={reg.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:underline flex items-center gap-1"
                          >
                            <Icon icon="solar:arrow-right-up-linear" /> Open Original
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-400 italic p-2 rounded bg-rose-500/10">
                        No screenshot uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Actions for Payment & Approval */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  {/* Payment Actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Payment:</span>
                    <Button
                      variant={currentPayment === 'verified' ? 'glass' : 'primary'}
                      size="sm"
                      onClick={() => openPaymentModal(reg, 'verified')}
                      icon="solar:check-circle-bold"
                    >
                      {currentPayment === 'verified' ? 'Re-verify' : 'Verify Payment'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPaymentModal(reg, 'rejected')}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      Reject Payment
                    </Button>
                  </div>

                  {/* Squad Approval Actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Squad:</span>
                    <Button
                      variant={currentApproval === 'approved' ? 'glass' : 'secondary'}
                      size="sm"
                      onClick={() => openApprovalModal(reg, 'approved')}
                      icon="solar:shield-check-bold"
                    >
                      {currentApproval === 'approved' ? 'Re-approve' : 'Approve Squad'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openApprovalModal(reg, 'rejected')}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      Reject Squad
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          reviewType === 'payment'
            ? paymentDecision === 'verified'
              ? 'Verify Payment Receipt'
              : 'Reject Payment'
            : approvalDecision === 'approved'
            ? 'Approve Team Registration'
            : 'Reject Team Registration'
        }
        description={`Team: "${activeReg?.teamName}" | OTR: ${activeReg?.otr || 'N/A'}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <Input
            label="Internal Review Note (Optional)"
            placeholder="e.g. OTR verified in bank statement / Duplicate name / Missing ID"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={
                (reviewType === 'payment' && paymentDecision === 'rejected') ||
                (reviewType === 'approval' && approvalDecision === 'rejected')
                  ? 'danger'
                  : 'primary'
              }
              size="sm"
              loading={submitting}
              onClick={handleConfirmReview}
            >
              Confirm Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Screenshot Preview Modal */}
      <Modal
        isOpen={Boolean(screenshotModalUrl)}
        onClose={() => setScreenshotModalUrl(null)}
        title="Payment Screenshot Proof"
        maxWidth="lg"
      >
        {screenshotModalUrl && (
          <div className="space-y-3 text-center">
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/40 p-2 flex items-center justify-center">
              <img
                src={screenshotModalUrl}
                alt="Payment Proof Full"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScreenshotModalUrl(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
