import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  ArrowLeft,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'Registration' | 'Payments' | 'Gameplay' | 'Support';
}

const FAQS: FAQItem[] = [
  {
    id: 1,
    question: 'How do I register my team?',
    answer:
      'Go to /register, select your tournament game (BGMI or Free Fire), fill in your squad and captain details, enter your player UIDs/IGNs, pay the entry fee via UPI, upload your payment receipt screenshot, and submit. Your squad will be reviewed by the tournament administrator.',
    category: 'Registration',
  },
  {
    id: 2,
    question: "What's the entry fee?",
    answer:
      'Entry fees depend on the arena mode: ₹100 per squad for Battle Royale circuits and ₹150 per squad for Clash Squad circuits. Fees cover prize pool pools and server hosting.',
    category: 'Payments',
  },
  {
    id: 3,
    question: 'How do I pay?',
    answer:
      'On Step 4 of the registration wizard, scan the official tournament UPI QR code or copy the UPI ID directly into Google Pay, PhonePe, Paytm, or BHIM. Pay the exact fee, save the transaction UTR number, and take a screenshot of the completed payment receipt.',
    category: 'Payments',
  },
  {
    id: 4,
    question: 'When will I get approved?',
    answer:
      'Squad registrations are reviewed within 24 hours of submission. Once the administrator verifies your payment screenshot and roster validity, you will receive an official approval confirmation email, and your team slot will be confirmed on the tournament leaderboard.',
    category: 'Registration',
  },
  {
    id: 5,
    question: 'What if my payment is rejected?',
    answer:
      'If your payment could not be verified (for example, an unreadable screenshot or invalid UTR reference), you will receive a rejection notice with the administrator\'s specific reason. You can re-register with verified details or contact our tournament support team.',
    category: 'Payments',
  },
  {
    id: 6,
    question: 'Can I change my roster after registering?',
    answer:
      'Once submitted, rosters cannot be changed directly by players to preserve bracket fairness. If you have an emergency roster swap before match day, contact the tournament admin with your team reference code and player details for manual update.',
    category: 'Registration',
  },
  {
    id: 7,
    question: 'What happens if I miss a match?',
    answer:
      'Squads that fail to join the custom room within 10 minutes of scheduled start time forfeit that match fixture by default. In Clash Squad, a forfeit is recorded as a 0-4 round loss. In Battle Royale, absent teams receive 0 placement points. Registration fees are non-refundable for missed fixtures.',
    category: 'Gameplay',
  },
  {
    id: 8,
    question: 'How is prize money distributed?',
    answer:
      'Prize pool breakdowns are published prior to tournament kickoff. The standard distribution follows a 50% / 30% / 20% split for 1st, 2nd, and 3rd place finishers, respectively. Winnings are disbursed via UPI to the registered captain within 48 hours of grand finals conclusion.',
    category: 'Gameplay',
  },
  {
    id: 9,
    question: 'Where can I watch live streams?',
    answer:
      'Live stream broadcasting links (YouTube & Twitch) and caster room credentials are posted in the Room Details dispatch sent to captains prior to kickoff. You can also monitor real-time score updates directly on our live leaderboard and public viewer pages.',
    category: 'Gameplay',
  },
  {
    id: 10,
    question: 'Who do I contact for issues?',
    answer:
      'For urgent tournament questions, contact our support team at support@gsarena.com, join our community Discord server at discord.gg/gsarena, or message our WhatsApp administrator hotline at +91 98765 43210.',
    category: 'Support',
  },
];

export function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col justify-between">
      <CosmicBackground />

      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Teko',sans-serif] tracking-wider leading-none text-white">
              FREQUENTLY ASKED QUESTIONS
            </h1>
            <span className="text-xs text-slate-300 font-mono tracking-widest block uppercase">
              Help Center & Tournament Knowledge Base
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Arena</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 my-4">
        {/* Search Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Teko',sans-serif] tracking-wide">
            How can we help your squad?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Find immediate answers regarding squad registrations, payment receipts, match room distribution, and competitive brackets.
          </p>
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search answers (e.g. UPI, entry fee, roster, streams)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm glass-card rounded-2xl border border-white/10">
              No matching questions found. Try a different search term or contact our support team.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <Card
                  key={faq.id}
                  className="border border-white/10 bg-black/40 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Q{faq.id}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-['Teko',sans-serif] tracking-wide">
                        {faq.question}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-slate-400"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="p-4 sm:p-5 pt-0 border-t border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })
          )}
        </div>

        {/* Still Have Questions Banner */}
        <div className="p-6 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
              Still have questions?
            </h4>
            <p className="text-xs text-slate-300">
              Our organizers are available on Discord and email to support you.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/contact">
              <Button variant="primary" size="sm">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Organizer</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 px-6 border-t border-white/10 text-center text-xs text-slate-400 bg-black/40 backdrop-blur-sm">
        © 2026 GS Arena. All Rights Reserved. Help & Knowledge Base.
      </footer>
    </div>
  );
}
