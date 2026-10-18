import React, { useState } from 'react';
import { SystemConfig, FaqItem } from '../../types/config';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { saveSystemConfig } from '../../services/configService';
import { Icon } from '@iconify/react';

interface SystemSettingsTabProps {
  config: SystemConfig;
  onSaved?: () => void;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({ config, onSaved }) => {
  const { success, error } = useToast();

  const [siteName, setSiteName] = useState(config.siteName || 'GS Arena');
  const [viewerBaseUrl, setViewerBaseUrl] = useState(
    config.viewerBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  );
  const [contactEmail, setContactEmail] = useState(config.contactEmail || 'tournaments@example.com');
  const [contactText, setContactText] = useState(config.contactText || '');
  const [registrationEnabled, setRegistrationEnabled] = useState(
    config.registrationEnabled !== undefined ? config.registrationEnabled : true
  );
  const [faqItems, setFaqItems] = useState<FaqItem[]>(config.faqItems || []);
  const [saving, setSaving] = useState(false);

  const handleAddFaq = () => {
    setFaqItems((prev) => [
      ...prev,
      {
        id: `faq-${Date.now()}`,
        question: 'New Question',
        answer: 'Answer to this question.',
      },
    ]);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveFaq = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate viewerBaseUrl protocol if set
    if (viewerBaseUrl.trim()) {
      try {
        const parsed = new URL(viewerBaseUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          error('Invalid URL', 'Viewer Base URL must begin with http:// or https://');
          return;
        }
      } catch {
        error('Invalid URL', 'Please enter a valid URL (e.g., https://your-domain.netlify.app)');
        return;
      }
    }

    setSaving(true);
    try {
      await saveSystemConfig({
        siteName: siteName.trim(),
        viewerBaseUrl: viewerBaseUrl.trim(),
        contactEmail: contactEmail.trim(),
        contactText: contactText.trim(),
        registrationEnabled,
        faqItems,
      });
      success('System Settings Saved', 'Global configuration successfully updated.');
      if (onSaved) onSaved();
    } catch (err: any) {
      error('Save Failed', err?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <GlassCard strong className="p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-white/10 pb-3">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            General & Broadcast Configuration
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure site identity, public viewer base URL for OBS overlays, and registration toggles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Platform Site Name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />

          <Input
            label="Public Viewer Base URL"
            value={viewerBaseUrl}
            onChange={(e) => setViewerBaseUrl(e.target.value)}
            helperText="Default: origin. Editable for Netlify or custom domains."
            placeholder="https://your-custom-site.netlify.app"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Operations Email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={registrationEnabled}
                onChange={(e) => setRegistrationEnabled(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Global Team Registration Enabled</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Contact Page Guidance Text
          </label>
          <textarea
            rows={2}
            value={contactText}
            onChange={(e) => setContactText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-black/20 p-3 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            placeholder="Help text shown on public contact page..."
          />
        </div>
      </GlassCard>

      {/* FAQ Items Editor */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              FAQ Content Management
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize tournament FAQ questions and answers.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddFaq}
            icon="solar:add-circle-bold"
          >
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-500">FAQ #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(index)}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
                >
                  <Icon icon="solar:trash-bin-trash-bold" /> Remove
                </button>
              </div>

              <Input
                label="Question"
                value={item.question}
                onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Answer
                </label>
                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-black/20 p-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg" loading={saving} icon="solar:diskette-bold">
          Save All System Settings
        </Button>
      </div>
    </form>
  );
};
