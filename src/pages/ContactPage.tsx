import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { systemConfigConverter } from '../lib/converters';
import { SystemConfig } from '../types/config';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/constants';
import { ContactMessageSchema } from '../lib/validators';
import { submitContactMessage } from '../services/configService';
import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify/react';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const { data: config } = useFirestoreDoc<SystemConfig>('config/system', systemConfigConverter);
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Parkinson's Law: Pre-fill email for authenticated users (editable, never pre-fill for logged-out)
  React.useEffect(() => {
    if (user && !user.isAnonymous && user.email && !email) {
      setEmail(user.email);
    }
    if (user && !user.isAnonymous && user.displayName && !name) {
      setName(user.displayName);
    }
  }, [user]);

  const contactEmail = config?.contactEmail || DEFAULT_SYSTEM_CONFIG.contactEmail;
  const contactText = config?.contactText || DEFAULT_SYSTEM_CONFIG.contactText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const val = ContactMessageSchema.safeParse({
      name,
      email,
      subject,
      message,
    });

    if (!val.success) {
      error('Validation Failed', val.error.errors[0]?.message || 'Please check form inputs.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage(val.data);
      success('Message Sent', 'Your inquiry has been submitted to tournament operations.');
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      error('Submission Error', err?.message || 'Failed to submit contact message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 text-left">
      <div className="text-center space-y-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Contact Tournament Operations
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {contactText}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="space-y-4">
          <GlassCard strong className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Official Channels
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Icon icon="solar:letter-bold" className="text-lg text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Email</span>
                  <a href={`mailto:${contactEmail}`} className="font-mono text-brand-500 hover:underline">
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Icon icon="solar:clock-circle-bold" className="text-lg text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Support Hours</span>
                  <span>Match days: 24/7 &bull; General: 10:00 - 22:00 IST</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Icon icon="solar:shield-check-bold" className="text-lg text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Referees</span>
                  <span>Official discord referees active during match times</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <GlassCard strong className="p-6 md:p-8">
            {submitted ? (
              <div className="py-10 text-center space-y-3">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl">
                  <Icon icon="solar:check-circle-bold" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Message Dispatched!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Thank you for reaching out. A tournament administrator will review your message shortly.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="alex@team.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  placeholder="e.g. Ineligible roster change request"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide relevant details, match numbers, or player IDs..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-black/20 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                    maxLength={2000}
                    required
                  />
                  <span className="text-[10px] text-slate-400 text-right block mt-1">
                    {message.length} / 2000 characters
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={submitting}
                    icon="solar:plain-bold"
                  >
                    Send Inquiry
                  </Button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

