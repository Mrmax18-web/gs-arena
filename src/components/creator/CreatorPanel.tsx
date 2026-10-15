import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Lock,
  Globe,
  AlertTriangle,
  KeyRound,
  Key,
  Eye,
  Mail,
  CreditCard,
  QrCode,
  IndianRupee,
  Upload,
  Phone,
  MessageCircle,
  Instagram,
  Plus,
  ExternalLink,
  Palette,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useCreator } from '../../hooks/useCreator';
import { usePaymentConfig } from '../../hooks/usePaymentConfig';
import { useContactInfo, saveContactInfo } from '../../hooks/useContactInfo';
import { useAdminRequests } from '../../hooks/useAdminRequests';
import type { AdminRequest } from '../../types';
import { BrandingEditor } from './BrandingEditor';
import { LandingAssetsEditor } from './LandingAssetsEditor';
import {
  saveCreatorConfig,
  addAdminEmail,
  removeAdminEmail,
  verifyCreatorPassword,
  resetCreatorConfig,
} from '../../lib/creator';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { copyToClipboard } from '../../lib/clipboard';
import { cn } from '../../lib/cn';

export function CreatorPanel() {
  const { config, refreshConfig, lock } = useCreator();

  // Status banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Admin addition (Email only)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Admin Requests
  const {
    requests: adminRequests,
    pendingCount: pendingAdminCount,
    approveRequest: handleApproveAdminRequest,
    rejectRequest: handleRejectAdminRequest,
  } = useAdminRequests(true);
  const [rejectingRequest, setRejectingRequest] = useState<AdminRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [requestActionLoadingId, setRequestActionLoadingId] = useState<string | null>(null);

  const onApproveRequest = async (req: AdminRequest) => {
    if (requestActionLoadingId) return;
    setRequestActionLoadingId(req.id);
    try {
      await handleApproveAdminRequest(req.id, req.email);
      showSuccess(`✅ Approved ${req.email}. Added to authorized administrators.`);
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const onConfirmRejectRequest = async () => {
    if (!rejectingRequest || requestActionLoadingId) return;
    setRequestActionLoadingId(rejectingRequest.id);
    try {
      await handleRejectAdminRequest(rejectingRequest.id, rejectReason);
      showSuccess(`Rejected application from ${rejectingRequest.email}.`);
      setRejectingRequest(null);
      setRejectReason('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  // Payment Configuration
  const { config: paymentConfig, saveConfig: savePaymentConfigSetting } = usePaymentConfig();
  const [payUpiId, setPayUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [feeBR, setFeeBR] = useState<number>(100);
  const [feeCS, setFeeCS] = useState<number>(150);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [payInstructions, setPayInstructions] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Contact Configuration (Creator Controlled)
  const { contact: loadedContact } = useContactInfo();
  const [contactEmail, setContactEmail] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactInstagramUrl, setContactInstagramUrl] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactPhones, setContactPhones] = useState<string[]>([]);
  const [contactDiscord, setContactDiscord] = useState('');
  const [contactDiscordUrl, setContactDiscordUrl] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Sync contact config when loaded
  React.useEffect(() => {
    if (loadedContact) {
      setContactEmail(loadedContact.email || '');
      setContactInstagram(loadedContact.instagram || '');
      setContactInstagramUrl(loadedContact.instagramUrl || '');
      setContactWhatsapp(loadedContact.whatsappCommunity || '');
      setContactPhones(
        Array.isArray(loadedContact.phoneNumbers) && loadedContact.phoneNumbers.length > 0
          ? loadedContact.phoneNumbers
          : ['']
      );
      setContactDiscord(loadedContact.discord || '');
      setContactDiscordUrl(loadedContact.discordUrl || '');
    }
  }, [loadedContact]);

  const handleAddPhone = () => {
    setContactPhones((prev) => [...prev, '']);
  };

  const handlePhoneChange = (index: number, val: string) => {
    setContactPhones((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemovePhone = (index: number) => {
    setContactPhones((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [''];
    });
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = contactEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showError('Please provide a valid contact email address.');
      return;
    }

    setIsSavingContact(true);
    try {
      const cleanedPhones = contactPhones
        .map((p) => p.trim().replace(/^\+91/, '').trim())
        .filter((p) => p.length > 0);

      await saveContactInfo({
        email: cleanEmail,
        instagram: contactInstagram.trim(),
        instagramUrl: contactInstagramUrl.trim(),
        whatsappCommunity: contactWhatsapp.trim(),
        phoneNumbers: cleanedPhones,
        discord: contactDiscord.trim(),
        discordUrl: contactDiscordUrl.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: config?.creatorEmail || 'creator',
      });

      showSuccess('✅ Contact info updated');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save contact info');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Sync payment config when loaded
  React.useEffect(() => {
    if (paymentConfig) {
      setPayUpiId(paymentConfig.upiId || '');
      setPayeeName(paymentConfig.payeeName || '');
      setFeeBR(paymentConfig.registrationFeeBR ?? 100);
      setFeeCS(paymentConfig.registrationFeeCS ?? 150);
      setQrImageUrl(paymentConfig.qrImageUrl || '');
      setPayInstructions(paymentConfig.instructions || '');
    }
  }, [paymentConfig]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showError('QR Code image must be smaller than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setQrImageUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payUpiId.trim() || !payUpiId.includes('@')) {
      showError('Please provide a valid UPI ID (e.g. name@paytm, name@okhdfcbank)');
      return;
    }

    setIsSavingPayment(true);
    try {
      await savePaymentConfigSetting({
        upiId: payUpiId.trim(),
        payeeName: payeeName.trim() || 'Tournament Organizer',
        registrationFeeBR: Number(feeBR) || 100,
        registrationFeeCS: Number(feeCS) || 150,
        qrImageUrl: qrImageUrl.trim(),
        instructions: payInstructions.trim(),
      });
      showSuccess('Payment & UPI settings saved successfully!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save payment settings');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Copy link
  const [copiedLink, setCopiedLink] = useState(false);

  // Email / Password change modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newCreatorEmail, setNewCreatorEmail] = useState('');
  const [authPassForEmail, setAuthPassForEmail] = useState('');

  const [passModalOpen, setPassModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Public password setup
  const [publicPassModalOpen, setPublicPassModalOpen] = useState(false);
  const [sharedPublicPass, setSharedPublicPass] = useState('');

  // Danger Zone Modals
  const [revokeAllModalOpen, setRevokeAllModalOpen] = useState(false);
  const [revokePass, setRevokePass] = useState('');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/public` : '/public';

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 4000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }

    setIsAddingAdmin(true);
    try {
      await addAdminEmail(clean);
      setNewAdminEmail('');
      showSuccess(`Authorized "${clean}" as Administrator.`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      await removeAdminEmail(email);
      showSuccess(`Revoked admin permissions from ${email}`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(publicUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showSuccess('Public viewer URL copied to clipboard');
    } else {
      showError('Unable to copy link to clipboard');
    }
  };

  const handleTogglePublicViewer = async () => {
    if (!config) return;
    const nextState = !config.publicViewerEnabled;
    try {
      await saveCreatorConfig({ publicViewerEnabled: nextState });
      await refreshConfig();
      showSuccess(nextState ? 'Public viewer enabled' : 'Public viewer disabled');
    } catch {
      showError('Failed to toggle public viewer');
    }
  };

  const handleTogglePasswordProtection = async () => {
    if (!config) return;
    if (config.publicPasswordRequired) {
      await saveCreatorConfig({ publicPasswordRequired: false });
      await refreshConfig();
      showSuccess('Public viewer password protection turned off');
    } else {
      setPublicPassModalOpen(true);
    }
  };

  const handleSavePublicPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sharedPublicPass.length < 4) {
      showError('Shared password must be at least 4 characters');
      return;
    }
    const hash = bcrypt.hashSync(sharedPublicPass, 8);
    await saveCreatorConfig({
      publicPasswordRequired: true,
      publicViewPasswordHash: hash,
    });
    await refreshConfig();
    setPublicPassModalOpen(false);
    setSharedPublicPass('');
    showSuccess('Public viewer now protected with shared passkey');
  };

  const handleChangeCreatorEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAuthed = await verifyCreatorPassword(authPassForEmail);
    if (!isAuthed) {
      showError('Incorrect master passkey');
      return;
    }
    try {
      await saveCreatorConfig({ creatorEmail: newCreatorEmail.trim().toLowerCase() });
      await addAdminEmail(newCreatorEmail.trim().toLowerCase());
      await refreshConfig();
      setEmailModalOpen(false);
      setNewCreatorEmail('');
      setAuthPassForEmail('');
      showSuccess('Creator master email updated');
    } catch {
      showError('Failed to update creator email');
    }
  };

  const handleChangeCreatorPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      showError('New passwords do not match');
      return;
    }
    const isAuthed = await verifyCreatorPassword(currentPass);
    if (!isAuthed) {
      showError('Current passkey is incorrect');
      return;
    }
    const hash = bcrypt.hashSync(newPass, 10);
    await saveCreatorConfig({ creatorPasswordHash: hash });
    await refreshConfig();
    setPassModalOpen(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    showSuccess('Creator master passkey successfully updated');
  };

  const handleRevokeAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAuthed = await verifyCreatorPassword(revokePass);
    if (!isAuthed) {
      showError('Incorrect master passkey');
      return;
    }
    if (config) {
      await saveCreatorConfig({ adminEmails: [config.creatorEmail.toLowerCase()] });
      await refreshConfig();
      setRevokeAllModalOpen(false);
      setRevokePass('');
      showSuccess('All secondary administrators revoked');
    }
  };

  const handleResetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmationText !== 'RESET') {
      showError('Type RESET to confirm');
      return;
    }
    await resetCreatorConfig();
    lock();
    window.location.href = '/';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Creator Master Controls"
        subtitle="Exclusive administrative authority over admin privilege delegations, security tokens, and public access."
        tag="RESTRICTED ROOT LEVEL"
        gradient="orange"
        icon={<ShieldCheck className="w-8 h-8 text-amber-400" />}
        action={
          <Button variant="secondary" size="sm" onClick={lock} className="text-xs">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock & Exit</span>
          </Button>
        }
      />

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* SECTION 1: Creator Identity */}
      <Card className="p-6 space-y-4 border border-white/10">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <UserCheck className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
            1. Creator Identity & Master Passkey
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              Primary Creator Email
            </span>
            <div className="text-sm font-mono font-bold text-white truncate">
              {config?.creatorEmail || 'dheerajsinghbaghel65@gmail.com'}
            </div>
            <p className="text-[11px] text-gray-500 pt-1">
              Permanent owner account with root permissions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEmailModalOpen(true)}
              className="text-xs"
            >
              <span>Change Email</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPassModalOpen(true)}
              className="text-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Master Passkey</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Admin Delegation (Email Authorization) */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              2. Admin Delegation & Authorized Emails
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            {config?.adminEmails?.length || 0} Authorized Admins
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Authorize administrator accounts by email address. Anyone signing in with an authorized email address is instantly granted full administrator privileges (tournament management, registrations, match scoring, and data backups).
        </p>

        {/* Add Admin Form (Email Only) */}
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] uppercase font-bold text-gray-400 block">
              Admin Email ID
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="e.g. admin@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/[0.08]"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isAddingAdmin}
              className="w-full sm:w-auto text-xs h-9 px-5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingAdmin ? 'Adding Admin...' : 'Authorize Admin Email'}</span>
            </Button>
          </div>
        </form>

        {/* Admin Roster List */}
        <div className="space-y-2 pt-2">
          {config?.adminEmails?.map((email) => {
            const isCreator = email.toLowerCase() === config?.creatorEmail?.toLowerCase();

            return (
              <div
                key={email}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs gap-3 hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] shrink-0" />
                  <span className="text-white font-mono font-medium truncate">{email}</span>
                  {isCreator ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-sans">
                      Owner / Creator
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-sans flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Authorized Admin
                    </span>
                  )}
                </div>

                {!isCreator && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(email)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Revoke Admin Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* SECTION 2.5: Admin Requests from Public Application Portal */}
      <Card className="p-6 space-y-5 border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              Admin Privilege Requests
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                pendingAdminCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {pendingAdminCount} Pending
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Review community requests for administrative credentials submitted via the public application portal. Approving an applicant immediately adds their Google account to your authorized administrator roster.
        </p>

        {/* Requests List */}
        {adminRequests.filter((r) => r.status === 'pending').length === 0 ? (
          <div className="p-6 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-gray-400">
            No pending admin applications at this time. Applications submitted at{' '}
            <Link to="/request-admin" className="text-amber-400 hover:underline">
              /request-admin
            </Link>{' '}
            will appear here for review.
          </div>
        ) : (
          <div className="space-y-3">
            {adminRequests
              .filter((r) => r.status === 'pending')
              .map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{req.email}</span>
                        <span className="text-[11px] text-gray-400">({req.name})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Applied on {new Date(req.requestedAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={requestActionLoadingId === req.id}
                        onClick={() => onApproveRequest(req)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        <span>{requestActionLoadingId === req.id ? 'Approving...' : 'Approve'}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={requestActionLoadingId === req.id}
                        onClick={() => {
                          setRejectingRequest(req);
                          setRejectReason('');
                        }}
                        className="text-xs text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
                      <span className="font-semibold text-gray-400 block mb-1">Reason / Experience:</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{req.reason}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* SECTION 3: Payment & UPI Settings */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              3. 💰 Payment & UPI Settings
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {payUpiId ? 'Active' : 'Unconfigured'}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Configure the official receiver UPI ID, payee organization name, squad entry fees, and QR code for public team registrations. All public squads pay into this account.
        </p>

        <form onSubmit={handleSavePaymentSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Official UPI ID / VPA <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="e.g. gsarena@paytm or organizer@okhdfcbank"
                value={payUpiId}
                onChange={(e) => setPayUpiId(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Payee / Organization Display Name
              </label>
              <Input
                placeholder="e.g. GS Arena Management"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Battle Royale (BR) Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={feeBR}
                onChange={(e) => setFeeBR(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Clash Squad (CS) Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="150"
                value={feeCS}
                onChange={(e) => setFeeCS(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* QR Code Upload / URL */}
          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              UPI QR Code Image (Upload or Paste URL)
            </span>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* QR Preview */}
              <div className="w-28 h-28 rounded-xl bg-white p-2 shrink-0 flex items-center justify-center border border-white/20">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-500">
                    <QrCode className="w-10 h-10 mx-auto text-gray-400" />
                    <span className="text-xs block mt-1 font-mono">Auto QR</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <Input
                  placeholder="Paste QR code image URL (or upload below)"
                  value={qrImageUrl}
                  onChange={(e) => setQrImageUrl(e.target.value)}
                  className="text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                  {qrImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrImageUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-gray-400 block">
              Custom Payment Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Include your team name in UPI remarks. Contact support on WhatsApp if needed."
              value={payInstructions}
              onChange={(e) => setPayInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/[0.08]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSavingPayment}
              className="text-xs h-9 px-6"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSavingPayment ? 'Saving Settings...' : 'Save Payment Settings'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION: Contact Details (Creator-Controlled) */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
              Official GS Arena Contact Details
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/20 text-amber-300 border border-orange-500/30">
            PUBLIC CHANNELS
          </span>
        </div>

        <form onSubmit={handleSaveContactInfo} className="space-y-4">
          <p className="text-xs text-slate-300">
            These contact details are displayed across the public <code className="text-amber-300">/contact</code> page and the global footer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Official Support Email *
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. gsarena704@gmail.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                WhatsApp Community Group Invite Link
              </label>
              <Input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Instagram Handle
              </label>
              <Input
                placeholder="@gs_arena07"
                value={contactInstagram}
                onChange={(e) => setContactInstagram(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Instagram Profile URL
              </label>
              <Input
                type="url"
                placeholder="https://instagram.com/gs_arena07"
                value={contactInstagramUrl}
                onChange={(e) => setContactInstagramUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Dynamic Phone Numbers List */}
          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-300 block">
                  Organizer Phone Numbers (Calling & WhatsApp)
                </span>
                <span className="text-[11px] text-gray-400">
                  Provide 10-digit mobile numbers for direct calls and WhatsApp chat buttons
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddPhone}
                className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Phone Number</span>
              </Button>
            </div>

            <div className="space-y-2 mt-3">
              {contactPhones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 w-6 text-right">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1 flex-1 relative">
                    <span className="text-xs font-mono text-gray-400 px-2.5 py-2 rounded-l-xl bg-white/5 border border-r-0 border-white/10">
                      +91
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 7828124941"
                      value={phone}
                      onChange={(e) => handlePhoneChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-r-xl text-xs text-white bg-white/5 border border-white/10 placeholder-gray-500 outline-none focus:border-orange-500 focus:bg-white/[0.08] font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(idx)}
                    title="Remove phone"
                    className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Discord Server (Optional)
              </label>
              <Input
                placeholder="e.g. GS Arena Esports"
                value={contactDiscord}
                onChange={(e) => setContactDiscord(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-400 block">
                Discord Invite URL (Optional)
              </label>
              <Input
                type="url"
                placeholder="https://discord.gg/..."
                value={contactDiscordUrl}
                onChange={(e) => setContactDiscordUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSavingContact}
              className="text-xs h-9 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              <span>{isSavingContact ? 'Saving Contact Info...' : '💾 Save Contact Info'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 4: Public Viewer Link */}
      <Card className="p-6 space-y-5 border border-white/10">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
            3. Public Viewer Portal Configuration
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="truncate w-full sm:w-auto">
            <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
              Public Viewer URL (Read-Only)
            </span>
            <code className="text-xs font-mono text-amber-300 break-all">{publicUrl}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/public"
              className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Open Viewer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyLink}
              className="text-xs flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-white">Public Viewer Mode</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                When disabled, visiting /public shows an offline notice instead of live data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTogglePublicViewer}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                config?.publicViewerEnabled !== false ? 'bg-emerald-500' : 'bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  config?.publicViewerEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-white">Password Protect Public Link</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Require external viewers to enter a shared access passkey before seeing the tournament.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTogglePasswordProtection}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                config?.publicPasswordRequired ? 'bg-orange-500' : 'bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  config?.publicPasswordRequired ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* SECTION 4: Landing Page Assets (Logos, Guns, 3D Models) */}
      <Card className="p-6 space-y-5 border border-amber-500/30 bg-gradient-to-br from-white/[0.02] to-black/40 shadow-xl shadow-amber-500/5">
        <LandingAssetsEditor />
      </Card>

      {/* SECTION 5: Branding & Asset Customizer */}
      <Card className="p-6 space-y-5 border border-orange-500/20 bg-gradient-to-br from-white/[0.02] to-black/40">
        <BrandingEditor />
      </Card>

      {/* SECTION 6: Danger Zone */}
      <Card className="p-6 space-y-4 border border-rose-500/30 bg-rose-500/[0.02]">
        <div className="flex items-center gap-2 pb-3 border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-extrabold text-white text-lg font-['Teko',sans-serif] text-2xl tracking-wide">
            5. Danger Zone
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-rose-500/20">
          <div>
            <h4 className="text-xs font-bold text-white">Revoke All Secondary Admins</h4>
            <p className="text-[11px] text-gray-400">
              Immediately drops all authorized admin emails except your primary Creator account.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setRevokeAllModalOpen(true)}
            className="shrink-0 text-xs"
          >
            Revoke All Admins
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-rose-500/20">
          <div>
            <h4 className="text-xs font-bold text-white">Reset Creator Configuration</h4>
            <p className="text-[11px] text-gray-400">
              Deletes the /config/creator document, allowing a fresh initial bootstrap.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            className="shrink-0 text-xs"
          >
            Reset Creator Config
          </Button>
        </div>
      </Card>

      {/* MODAL: Change Email Modal */}
      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Change Creator Email"
      >
        <form onSubmit={handleChangeCreatorEmail} className="space-y-4">
          <Input
            label="New Creator Email"
            type="email"
            placeholder="newowner@gmail.com"
            value={newCreatorEmail}
            onChange={(e) => setNewCreatorEmail(e.target.value)}
            required
          />
          <Input
            label="Enter Current Master Passkey to Confirm"
            type="password"
            placeholder="Passkey..."
            value={authPassForEmail}
            onChange={(e) => setAuthPassForEmail(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save New Email
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Change Passkey Modal */}
      <Modal
        open={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        title="Change Master Passkey"
      >
        <form onSubmit={handleChangeCreatorPass} className="space-y-4">
          <Input
            label="Current Passkey"
            type="password"
            placeholder="Current passkey..."
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            required
          />
          <Input
            label="New Passkey (min 6 chars)"
            type="password"
            placeholder="New passkey..."
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />
          <Input
            label="Confirm New Passkey"
            type="password"
            placeholder="Confirm passkey..."
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setPassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Passkey
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Public Passkey Modal */}
      <Modal
        open={publicPassModalOpen}
        onClose={() => setPublicPassModalOpen(false)}
        title="Set Shared Public Passkey"
      >
        <form onSubmit={handleSavePublicPassword} className="space-y-4">
          <p className="text-xs text-gray-300">
            Viewers will need to enter this shared password to view the leaderboard on /public.
          </p>
          <Input
            label="Shared Viewer Password"
            type="text"
            placeholder="e.g. tournament2026"
            value={sharedPublicPass}
            onChange={(e) => setSharedPublicPass(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setPublicPassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Enable Password Protection
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Revoke All Modal */}
      <Modal
        open={revokeAllModalOpen}
        onClose={() => setRevokeAllModalOpen(false)}
        title="Confirm Revocation of All Admins"
      >
        <form onSubmit={handleRevokeAll} className="space-y-4">
          <p className="text-xs text-rose-300">
            This will drop all admin access rights across the platform except for your primary email.
          </p>
          <Input
            label="Enter Master Creator Passkey"
            type="password"
            placeholder="Master passkey..."
            value={revokePass}
            onChange={(e) => setRevokePass(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setRevokeAllModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Revoke All
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reset Settings Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Creator Settings Document"
      >
        <form onSubmit={handleResetSettings} className="space-y-4">
          <p className="text-xs text-rose-300">
            Warning: This wipes /config/creator completely. Type <strong>RESET</strong> in capital letters to confirm.
          </p>
          <Input
            label="Confirmation"
            placeholder="Type RESET"
            value={resetConfirmationText}
            onChange={(e) => setResetConfirmationText(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              disabled={resetConfirmationText !== 'RESET'}
            >
              Reset Configuration
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reject Admin Request Modal */}
      <Modal
        open={Boolean(rejectingRequest)}
        onClose={() => {
          if (!requestActionLoadingId) setRejectingRequest(null);
        }}
        title="Reject Admin Application"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            You are rejecting the admin request from{' '}
            <strong className="text-white">{rejectingRequest?.email}</strong> ({rejectingRequest?.name}).
          </p>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-400 block">
              Reason for Rejection (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Current admin slots are filled, or insufficient details provided..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={Boolean(requestActionLoadingId)}
              onClick={() => setRejectingRequest(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              disabled={Boolean(requestActionLoadingId)}
              onClick={onConfirmRejectRequest}
            >
              {requestActionLoadingId ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
