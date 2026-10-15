import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Gamepad2,
  Flame,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function RulesPage() {
  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col justify-between">
      <CosmicBackground />

      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Teko',sans-serif] tracking-wider leading-none text-white">
              TOURNAMENT RULEBOOK & REGULATIONS
            </h1>
            <span className="text-xs text-slate-300 font-mono tracking-widest block uppercase">
              Official Competitive Rulebook • Season 1
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
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 my-4">
        {/* Intro Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/20 text-amber-300 border border-orange-500/30 inline-block mb-2">
            Standard Operating Procedures
          </span>
          <h2 className="text-3xl font-extrabold text-white font-['Teko',sans-serif] tracking-wide">
            Fair Play & Competitive Integrity
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mt-1">
            All players, captains, and substitute members competing in GS Arena circuits must strictly adhere to the tournament bylaws outlined below. Violation will result in immediate match forfeits or bans.
          </p>
        </div>

        {/* Section 1: General Rules */}
        <Card className="p-6 space-y-4 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-black flex items-center justify-center text-sm font-mono border border-orange-500/30">
              01
            </span>
            <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
              General Eligibility & Squad Roster
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Age & Account Eligibility:</strong> All participating players must be at least 16 years of age and hold an active, non-banned BGMI or Free Fire game account.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Team Composition:</strong> Squads consist of 4 primary starters and up to 1 registered substitute. No player may play for more than one team in the same championship season.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Registration Deadline:</strong> Registrations close 24 hours prior to the scheduled group stage fixtures or when maximum squad capacity is achieved.</span>
            </li>
          </ul>
        </Card>

        {/* Section 2: BGMI Rules */}
        <Card className="p-6 space-y-4 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm font-mono border border-amber-500/30">
              02
            </span>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
                BGMI (Battle Royale) Scoring & Match Rules
              </h3>
            </div>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-300">
            <p><strong>Official Maps:</strong> Erangel, Miramar, and Rondo on default esports weather and circle settings.</p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase block mb-2">
                Placement Points Distribution:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-black/40 border border-white/5">1st Place: <strong>10 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">2nd Place: <strong>6 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">3rd Place: <strong>5 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">4th Place: <strong>4 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">5th Place: <strong>3 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">6th Place: <strong>2 pts</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">7th-8th: <strong>1 pt</strong></div>
                <div className="p-2 rounded bg-black/40 border border-white/5">Per Kill: <strong>1 pt</strong></div>
              </div>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong>Room Access:</strong> Custom Room ID and Password will be dispatched to the captain via email and WhatsApp exactly 30 minutes before match kickoff.</li>
              <li><strong>Hardware Restrictions:</strong> Mobile devices (smartphones, iPads/tablets) only. Emulators (Bluestacks, LDPlayer, GameLoop) are strictly banned.</li>
              <li><strong>Anti-Teaming:</strong> Any intentional collaboration between opposing squads results in immediate disqualification of both teams.</li>
            </ul>
          </div>
        </Card>

        {/* Section 3: Free Fire Clash Squad Rules */}
        <Card className="p-6 space-y-4 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-black flex items-center justify-center text-sm font-mono border border-red-500/30">
              03
            </span>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
                Free Fire Clash Squad Format & Playoff Tree
              </h3>
            </div>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <p><strong>Series Format:</strong> 4v4 Clash Squad, Best of 7 rounds (first team to secure 4 rounds wins the match fixture).</p>
            <p><strong>Map Rotation Pool:</strong> Bermuda, Purgatory, Kalahari, Alpine, Nexterra, and Solara.</p>
            <p><strong>Scoring Protocol:</strong> No placement/kill points matrix applies in CS — fixtures are tracked purely by round wins/losses and direct series progression in the tournament bracket.</p>
            <p><strong>No-Show Policy:</strong> Squads failing to join the custom lobby within 10 minutes of scheduled start time forfeit the match by default (0-4 scoreline).</p>
          </div>
        </Card>

        {/* Section 4: Payment Rules */}
        <Card className="p-6 space-y-4 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm font-mono border border-emerald-500/30">
              04
            </span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
                Entry Fees, UPI Transactions & Verification
              </h3>
            </div>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-300">
            <p><strong>Registration Fees:</strong> ₹100 per squad for Battle Royale circuits; ₹150 per squad for Clash Squad circuits.</p>
            <p><strong>Payment Requirements:</strong> Each registration requires a valid 12-digit UPI Transaction Reference (UTR) number along with a clear screenshot of the bank or UPI confirmation screen.</p>
            <p><strong>Verification Timeline:</strong> Payments are verified by administrators in the Approval Queue within 24 hours of submission. Once approved, the team slot is secured on the leaderboard.</p>
            <p><strong>Refund Policy:</strong> All registration fees are strictly non-refundable once approved, except in cases where a tournament fixture is officially cancelled by organizers.</p>
          </div>
        </Card>

        {/* Section 5: Code of Conduct */}
        <Card className="p-6 space-y-4 border border-rose-500/30 bg-rose-500/[0.02]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-rose-500/20 text-rose-400">
            <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-sm font-mono border border-rose-500/30">
              05
            </span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
                Code of Conduct & Disciplinary Penalties
              </h3>
            </div>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-300">
            <p><strong>Cheating & Third-Party Tools:</strong> Use of wallhacks, auto-aim, speedhacks, modified config files, or network throttling will result in permanent device and account bans from all future circuits.</p>
            <p><strong>Sportsmanship:</strong> Abusive behavior, toxicity, racism, or harassment toward players or tournament arbiters is strictly prohibited.</p>
            <p><strong>Penalty Progression:</strong> First Offense: Official Warning or Point Deduction → Second Offense: Instant Match Disqualification → Severe Offense: Permanent Circuit Blacklist.</p>
          </div>
        </Card>

        {/* FEATURE 4: Section 6: No Rematch Policy */}
        <Card className="p-6 space-y-4 border border-amber-500/30 bg-amber-500/[0.03]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/20 text-amber-400">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm font-mono border border-amber-500/30">
              06
            </span>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide">
                ⚖️ Match Rules — No Rematch Policy
              </h3>
            </div>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-semibold mb-2">
              ⚠️ Strict Competitive Directive: Match schedules must run with zero delay. All participating teams acknowledge and agree to this policy prior to registration.
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Once a match starts, it CANNOT be replayed under any personal circumstances.</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Missing Teammates:</strong> If teammates fail to show up or enter room lobby prior to match countdown start → <strong>NO rematch will be granted</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Play With Available or Forfeit:</strong> The team must drop into the match with available players or submit a forfeit loss.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Team Disadvantage:</strong> Missing players or disconnected members are deemed internal squad risks, <strong>NOT a valid justification for a rematch</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Arbitration is Final:</strong> The appointed tournament admin's decision on match scores and outcomes is absolute and <strong>FINAL</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Technical Exceptions Only:</strong> Only verified game server crashes, room bugging affecting all squads, or organizer-side technical failures can trigger an official match review.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Review Window:</strong> Official review inquiries must be filed with arbiters within <strong>5 minutes</strong> of match conclusion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Quota:</strong> Maximum 1 review request per team per tournament season. Frivolous disputes will result in point penalties.</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-black/60 border border-white/10">
          <div>
            <h4 className="text-xl font-bold text-white font-['Teko',sans-serif]">Ready to Compete?</h4>
            <p className="text-xs text-slate-300">Review the rules with your squad and register your roster today.</p>
          </div>
          <Link to="/register">
            <Button variant="primary" size="md">
              <span>Register Squad Now →</span>
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 px-6 border-t border-white/10 text-center text-xs text-slate-400 bg-black/40 backdrop-blur-sm">
        © 2026 GS Arena. All Rights Reserved. Official Esports Rulebook.
      </footer>
    </div>
  );
}
