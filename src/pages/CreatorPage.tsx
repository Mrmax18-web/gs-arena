import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { systemConfigConverter, adminRequestConverter } from '../lib/converters';
import { SystemConfig } from '../types/config';
import { AdminRequest } from '../types/auth';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/constants';
import { Tabs } from '../components/ui/Tabs';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { AdminApprovalsTab } from '../components/creator/AdminApprovalsTab';
import { SystemSettingsTab } from '../components/creator/SystemSettingsTab';
import { AppearanceTab } from '../components/creator/AppearanceTab';
import { DemoDataTab } from '../components/creator/DemoDataTab';
import { BackgroundTab } from '../components/creator/BackgroundTab';
import { isCreator } from '../lib/permissions';
import { Icon } from '@iconify/react';
import { where } from 'firebase/firestore';

export const CreatorPage: React.FC = () => {
  const { user, role, claimCreator, refreshRole } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'approvals' | 'settings' | 'appearance' | 'demo' | 'background'>('approvals');
  const [unlockCode, setUnlockCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);


  // System config doc
  const { data: config } = useFirestoreDoc<SystemConfig>(
    'config/system',
    systemConfigConverter
  );

  // Admin requests
  const adminReqConstraints = [where('status', '==', 'pending')];
  const {
    data: adminRequests,
    refetch: refetchRequests,
  } = useFirestoreCollection<AdminRequest>(
    'adminRequests',
    adminReqConstraints,
    adminRequestConverter
  );

  const handleUnlockCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockCode.trim()) {
      error('Access Code Required', 'Please enter the creator verification code.');
      return;
    }

    setUnlocking(true);
    try {
      const res = await claimCreator(unlockCode.trim());
      if (res.success) {
        success('Creator Privileges Granted', 'Custom user claim updated. Welcome, Creator.');
        setUnlockCode('');
        await refreshRole();
      } else {
        error('Unlock Failed', res.message || 'Invalid or expired access code.');
      }
    } catch (err: any) {
      error('Unlock Error', err?.message || 'Server error verifying access code.');
    } finally {
      setUnlocking(false);
    }
  };

  // If user is signed in but does not yet have the 'creator' custom claim
  if (!isCreator(role)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <GlassCard strong className="max-w-md w-full text-center p-8 border-amber-500/30 shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md">
            <Icon icon="solar:lightbulb-bolt-bold" className="text-3xl" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Creator Authorization
          </span>

          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            Unlock Creator Console
          </h2>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter your cryptographically verified Creator Access Code to upgrade your Firebase Custom Claims. Verified securely via backend Cloud Function.
          </p>

          <form onSubmit={handleUnlockCreator} className="mt-6 space-y-4 text-left">
            <Input
              label="Creator Access Code"
              type="password"
              placeholder="Enter 6-digit access code"
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              leftIcon="solar:key-minimalistic-bold"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={unlocking}
              className="w-full"
            >
              Verify & Elevate Session
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-400">
            Current account: <span className="font-mono text-slate-700 dark:text-slate-300">{user?.email || 'Anonymous'}</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  const tabsConfig = [
    {
      id: 'approvals',
      label: 'Admin Approvals',
      icon: 'solar:shield-user-bold',
      badge: adminRequests.length || undefined,
    },
    { id: 'settings', label: 'System Settings', icon: 'solar:settings-minimalistic-bold' },
    { id: 'appearance', label: 'Appearance', icon: 'solar:palette-bold' },
    { id: 'demo', label: 'Demo & Wipes', icon: 'solar:database-bold' },
    { id: 'background', label: 'WebGL Shader', icon: 'solar:paint-roller-bold' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Icon icon="solar:lightbulb-bolt-bold" /> Creator Superadmin Console
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Platform Master Controls
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={async () => {
              await refreshRole();
              info('Token Refreshed', 'Custom claims reloaded from server.');
            }}
            icon="solar:refresh-bold"
          >
            Sync Claims
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* Tab Panels */}
      {activeTab === 'approvals' && (
        <AdminApprovalsTab
          requests={adminRequests}
          onRefresh={() => refetchRequests()}
        />
      )}

      {activeTab === 'settings' && (
        <SystemSettingsTab config={config || DEFAULT_SYSTEM_CONFIG} />
      )}

      {activeTab === 'appearance' && (
        <AppearanceTab systemConfig={config || undefined} />
      )}


      {activeTab === 'demo' && <DemoDataTab />}

      {activeTab === 'background' && <BackgroundTab />}
    </div>
  );
};

