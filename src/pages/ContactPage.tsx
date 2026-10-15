import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Gamepad2,
  ArrowLeft,
  Copy,
  Check,
  Send,
  CheckCircle2,
  ExternalLink,
  Headphones,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TagChip } from '../components/ui/TagChip';
import { ContactCard } from '../components/ContactCard';
import { useContactInfo } from '../hooks/useContactInfo';

function ContactSkeleton() {
  return (
    <div className="max-w-[68ch] mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-surface-2 rounded-xl w-64" />
      <div className="h-5 bg-surface-2 rounded-lg w-96" />
      <div className="grid gap-4 mt-8">
        <div className="h-24 bg-surface-2 rounded-2xl" />
        <div className="h-24 bg-surface-2 rounded-2xl" />
        <div className="h-24 bg-surface-2 rounded-2xl" />
        <div className="h-48 bg-surface-2 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Official tournament desk contact page.
 * Provides community channels, phone numbers, inquiries, and arbiter applications.
 */
export function ContactPage() {
  const { contact, loading } = useContactInfo();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Quick inquiry state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryMessage.trim()) return;

    const targetEmail = contact?.email || 'gsarena704@gmail.com';
    const sub = encodeURIComponent(`[GS Arena Tournament Support] ${inquirySubject || 'Inquiry'}`);
    const body = encodeURIComponent(
      `From: ${inquiryName}\nContact Email: ${inquiryEmail}\n\nMessage:\n${inquiryMessage}`
    );
    window.location.href = `mailto:${targetEmail}?subject=${sub}&body=${body}`;
    setSentNotice(true);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen text-foreground flex flex-col justify-between">
        <ContactSkeleton />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-border bg-surface/75 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accent-orange flex items-center justify-center shadow-lg shadow-accent/20">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wider leading-none text-foreground">
              CONTACT GS ARENA
            </h2>
            <span className="text-xs text-muted font-mono tracking-widest block uppercase mt-0.5">
              Official Help Desk & Community Channels
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-muted hover:text-foreground flex items-center gap-1.5 transition-colors font-mono bg-surface hover:bg-surface-2 px-3 py-1.5 rounded-lg border border-border"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Arena</span>
        </Link>
      </header>

      {/* Main Content with 68ch measure */}
      <main className="relative z-10 flex-1 w-full max-w-[68ch] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 my-4">
        {/* Title Banner */}
        <div className="space-y-2">
          <TagChip label="OFFICIAL TOURNAMENT DESK" variant="accent" size="sm" />
          <h1 className="text-3xl sm:text-4xl font-black text-foreground font-mono tracking-wide">
            Contact GS Arena
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed font-sans">
            Reach out for registrations, slot confirmations, payment queries, or tournament support. Our team is active across WhatsApp and community channels.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid gap-4">
          {/* Email */}
          {contact.email && (
            <ContactCard
              icon={<Mail className="w-5 h-5" />}
              label="Official Email"
              value={contact.email}
              href={`mailto:${contact.email}`}
              action="Send Email"
              copyable
            />
          )}

          {/* Instagram */}
          {contact.instagram && (
            <ContactCard
              icon={<Instagram className="w-5 h-5 text-pink-400" />}
              label="Instagram"
              value={contact.instagram}
              href={contact.instagramUrl || `https://instagram.com/${contact.instagram.replace('@', '')}`}
              action="Follow Us"
              external
              copyable
            />
          )}

          {/* WhatsApp Community */}
          {contact.whatsappCommunity && (
            <ContactCard
              icon={<MessageCircle className="w-5 h-5 text-emerald-400" />}
              label="WhatsApp Community"
              value="Official GS Arena Competitive Community"
              href={contact.whatsappCommunity}
              action="Join Group"
              external
              copyable={false}
            />
          )}

          {/* Phone Numbers / WhatsApp List */}
          {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
            <Card className="p-5 border border-white/10 bg-white/[0.03] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-amber-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Organizer Phone / WhatsApp</h2>
                    <p className="text-xs text-slate-300">
                      Direct voice calling & WhatsApp chat lines with tournament officials
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                  {contact.phoneNumbers.length} Lines Active
                </span>
              </div>

              <ul className="space-y-2.5">
                {contact.phoneNumbers.map((phone) => (
                  <li
                    key={phone}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-mono font-semibold text-white tracking-wider">
                        +91 {phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(phone)}
                        title="Copy phone number"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {copiedPhone === phone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:+91${phone}`}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/91${phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Discord (if set) */}
          {contact.discord && (
            <ContactCard
              icon={<Gamepad2 className="w-5 h-5 text-indigo-400" />}
              label="Discord Server"
              value={contact.discord}
              href={contact.discordUrl}
              action="Join Discord"
              external
              copyable
            />
          )}
        </div>

        {/* Send Direct Message / Inquiry Form */}
        <Card className="p-6 border border-border bg-surface/75 backdrop-blur-md space-y-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Send className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-base font-black text-foreground font-mono">Send Direct Message</h3>
              <p className="text-xs text-muted font-sans">
                Compose an email directly to the tournament management desk
              </p>
            </div>
          </div>

          {sentNotice && (
            <div className="p-3.5 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
              <span>Email client opened! You can now send your inquiry to GS Arena.</span>
            </div>
          )}

          <form onSubmit={handleSendInquiry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-muted uppercase tracking-wider block">
                  Your Name / Captain IGN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain Alex"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-surface border border-border placeholder-muted outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-muted uppercase tracking-wider block">
                  Your Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. captain@gmail.com"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-surface border border-border placeholder-muted outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-muted uppercase tracking-wider block">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Team Slot Confirmation / Payment Verification"
                value={inquirySubject}
                onChange={(e) => setInquirySubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-surface border border-border placeholder-muted outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-muted uppercase tracking-wider block">
                Message / Query *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your inquiry, transaction reference, or squad details..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-surface border border-border placeholder-muted outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" variant="primary" size="md">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Open Mail to GS Arena</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Admin Application Banner */}
        <Card className="p-5 border border-warn/30 bg-warn/5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-black text-foreground font-mono flex items-center justify-center sm:justify-start gap-2">
              <span>Want to Help Organize Tournaments?</span>
            </h3>
            <p className="text-xs text-muted font-sans">
              Apply for administrative credentials to verify registrations, manage squad rosters, and record match outcomes.
            </p>
          </div>
          <Link to="/request-admin" className="shrink-0">
            <Button variant="secondary" size="sm" className="border-warn/40 text-warn hover:bg-warn/10 font-mono">
              Apply for Admin Access
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
