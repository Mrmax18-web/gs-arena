import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Mail,
  Instagram,
  MessageCircle,
  Phone,
  FileText,
  HelpCircle,
  Headphones,
  Copy,
  Check,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { useContactInfo } from '../../hooks/useContactInfo';
import { copyToClipboard } from '../../lib/clipboard';

export function Footer() {
  const { contact } = useContactInfo();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedPhone(text);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  return (
    <footer role="contentinfo" aria-label="Site footer" className="w-full mt-auto border-t border-white/10 bg-[#050711]/90 backdrop-blur-xl text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          {/* Column 1: Organization & Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/gs-arena-logo.png"
                  alt="GS Arena"
                  className="w-10 h-10 rounded-xl object-contain bg-black/60 p-1 border border-orange-500/30"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fb = (e.target as HTMLElement).parentElement?.querySelector('.footer-logo-fb') as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div className="footer-logo-fb hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 items-center justify-center text-white font-black text-xs font-['Teko',sans-serif] text-base">
                  GS
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Teko',sans-serif] tracking-wider text-white leading-none">
                  GS ARENA
                </h3>
                <span className="text-xs text-amber-400 font-mono tracking-wider font-semibold">
                  Official Esports Circuit
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Official competitive esports circuit engine for BGMI and Free Fire tournaments. Providing automated leaderboards, match scorecards, bracket trees, and player analytics.
            </p>
          </div>

          {/* Column 2: Official Contact Channels */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-200">
              Official GS Arena Channels
            </h4>
            <ul className="space-y-2 text-xs">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-slate-300 hover:text-white transition-colors truncate"
                  >
                    {contact.email}
                  </a>
                </li>
              )}

              {contact.instagram && (
                <li className="flex items-center gap-2">
                  <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <a
                    href={contact.instagramUrl || `https://instagram.com/${contact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>{contact.instagram}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              )}

              {contact.whatsappCommunity && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a
                    href={contact.whatsappCommunity}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1 font-semibold"
                  >
                    <span>WhatsApp Community Group</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              )}

              {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                <li className="flex items-start gap-2 pt-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {contact.phoneNumbers.map((phone) => (
                      <span
                        key={phone}
                        className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-white/5"
                      >
                        <a href={`tel:+91${phone}`} className="hover:text-amber-300">
                          +91 {phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(phone)}
                          title="Copy phone"
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          {copiedPhone === phone ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </span>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-200">
              Tournament Help & Bylaws
            </h4>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/public"
                className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Public Viewer</span>
              </Link>
              <Link
                to="/rules"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Rulebook</span>
              </Link>
              <Link
                to="/faq"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>FAQ & Help</span>
              </Link>
              <Link
                to="/contact"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact Arena</span>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Have questions regarding registration, slot allocations, or match rooms? Connect with organizers via WhatsApp or the contact form.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="/gs-arena-logo.png"
                alt="GS Arena"
                className="w-8 h-8 rounded-lg object-contain bg-black/60 p-0.5 border border-orange-500/30"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fb = (e.target as HTMLElement).parentElement?.querySelector('.footer-bot-fb') as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div className="footer-bot-fb hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 items-center justify-center text-white font-black text-xs">
                GS
              </div>
            </div>
            <div>
              <p className="text-slate-300 font-medium">© 2026 GS Arena · Official Esports Circuit</p>
              <p className="text-[11px] text-slate-400 font-mono">gsarena704@gmail.com · @gs_arena07</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/rules" className="hover:text-white transition-colors">
              Terms & Rules
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Support
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/creator" className="hover:text-amber-400 transition-colors font-mono">
              Creator Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
