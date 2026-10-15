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
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TagChip } from '../components/ui/TagChip';
import { FeatureList } from '../components/ui/FeatureList';

/**
 * Official tournament rulebook & regulations document.
 * Outlines fair play bylaws, map rotations, scoring algorithms, and disciplinary protocols.
 */
export function RulesPage() {
  return (
    <div className="relative min-h-screen text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-border bg-surface/75 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accent-orange flex items-center justify-center shadow-lg shadow-accent/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider leading-none text-foreground">
              TOURNAMENT RULEBOOK & REGULATIONS
            </h1>
            <span className="text-xs text-muted font-mono tracking-widest block uppercase mt-0.5">
              Official Competitive Rulebook • Season 1
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
        {/* Intro Banner */}
        <div className="p-6 rounded-2xl bg-surface/75 backdrop-blur-md border border-border">
          <TagChip label="STANDARD OPERATING PROCEDURES" variant="accent" size="sm" />
          <h2 className="text-3xl font-black text-foreground font-mono tracking-wide mt-2">
            Fair Play & Competitive Integrity
          </h2>
          <p className="text-sm text-muted leading-relaxed mt-1 font-sans">
            All players, captains, and substitute members competing in GS Arena circuits must strictly adhere to the tournament bylaws outlined below. Violation will result in immediate match forfeits or bans.
          </p>
        </div>

        {/* Section 1: General Rules */}
        <Card className="p-6 space-y-4 border border-border bg-surface/75 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <span className="w-8 h-8 rounded-lg bg-accent/20 text-accent font-black flex items-center justify-center text-sm font-mono border border-accent/40">
              01
            </span>
            <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
              General Eligibility & Squad Roster
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-muted font-sans">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Age & Account Eligibility:</strong> All participating players must be at least 16 years of age and hold an active, non-banned BGMI or Free Fire game account.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Team Composition:</strong> Squads consist of 4 primary starters and up to 1 registered substitute. No player may play for more than one team in the same championship season.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Registration Deadline:</strong> Registrations close 24 hours prior to the scheduled group stage fixtures or when maximum squad capacity is achieved.</span>
            </li>
          </ul>
        </Card>

        {/* Section 2: BGMI Rules */}
        <Card className="p-6 space-y-4 border border-border bg-surface/75 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <span className="w-8 h-8 rounded-lg bg-accent-orange/20 text-accent-orange font-black flex items-center justify-center text-sm font-mono border border-accent-orange/40">
              02
            </span>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-accent-orange" />
              <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
                BGMI (Battle Royale) Scoring & Match Rules
              </h3>
            </div>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-muted font-sans">
            <p><strong className="text-foreground">Official Maps:</strong> Erangel, Miramar, and Rondo on default esports weather and circle settings.</p>
            <div className="p-4 rounded-xl bg-surface border border-border">
              <span className="text-xs font-mono font-bold text-accent uppercase block mb-2">
                Placement Points Distribution:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">1st Place: <strong>10 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">2nd Place: <strong>6 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">3rd Place: <strong>5 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">4th Place: <strong>4 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">5th Place: <strong>3 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">6th Place: <strong>2 pts</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">7th-8th: <strong>1 pt</strong></div>
                <div className="p-2 rounded bg-surface-2 border border-border text-foreground">Per Kill: <strong>1 pt</strong></div>
              </div>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong className="text-foreground">Room Access:</strong> Custom Room ID and Password will be dispatched to the captain via email and WhatsApp exactly 30 minutes before match kickoff.</li>
              <li><strong className="text-foreground">Hardware Restrictions:</strong> Mobile devices (smartphones, iPads/tablets) only. Emulators (Bluestacks, LDPlayer, GameLoop) are strictly banned.</li>
              <li><strong className="text-foreground">Anti-Teaming:</strong> Any intentional collaboration between opposing squads results in immediate disqualification of both teams.</li>
            </ul>
          </div>
        </Card>

        {/* Section 3: Free Fire Clash Squad Rules */}
        <Card className="p-6 space-y-4 border border-border bg-surface/75 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <span className="w-8 h-8 rounded-lg bg-danger/20 text-danger font-black flex items-center justify-center text-sm font-mono border border-danger/40">
              03
            </span>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-danger" />
              <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
                Free Fire Clash Squad Format & Playoff Tree
              </h3>
            </div>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm text-muted font-sans">
            <p><strong className="text-foreground">Series Format:</strong> 4v4 Clash Squad, Best of 7 rounds (first team to secure 4 rounds wins the match fixture).</p>
            <p><strong className="text-foreground">Map Rotation Pool:</strong> Bermuda, Purgatory, Kalahari, Alpine, Nexterra, and Solara.</p>
            <p><strong className="text-foreground">Scoring Protocol:</strong> No placement/kill points matrix applies in CS — fixtures are tracked purely by round wins/losses and direct series progression in the tournament bracket.</p>
            <p><strong className="text-foreground">No-Show Policy:</strong> Squads failing to join the custom lobby within 10 minutes of scheduled start time forfeit the match by default (0-4 scoreline).</p>
          </div>
        </Card>

        {/* Section 4: Payment Rules */}
        <Card className="p-6 space-y-4 border border-border bg-surface/75 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <span className="w-8 h-8 rounded-lg bg-success/20 text-success font-black flex items-center justify-center text-sm font-mono border border-success/40">
              04
            </span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-success" />
              <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
                Entry Fees, UPI Transactions & Verification
              </h3>
            </div>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-muted font-sans">
            <p><strong className="text-foreground">Registration Fees:</strong> ₹100 per squad for Battle Royale circuits; ₹150 per squad for Clash Squad circuits.</p>
            <p><strong className="text-foreground">Payment Requirements:</strong> Each registration requires a valid 12-digit UPI Transaction Reference (UTR) number along with a clear screenshot of the bank or UPI confirmation screen.</p>
            <p><strong className="text-foreground">Verification Timeline:</strong> Payments are verified by administrators in the Approval Queue within 24 hours of submission. Once approved, the team slot is secured on the leaderboard.</p>
            <p><strong className="text-foreground">Refund Policy:</strong> All registration fees are strictly non-refundable once approved, except in cases where a tournament fixture is officially cancelled by organizers.</p>
          </div>
        </Card>

        {/* Section 5: Code of Conduct */}
        <Card className="p-6 space-y-4 border border-danger/30 bg-danger/5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-danger/20 text-danger">
            <span className="w-8 h-8 rounded-lg bg-danger/20 text-danger font-black flex items-center justify-center text-sm font-mono border border-danger/40">
              05
            </span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
                Code of Conduct & Disciplinary Penalties
              </h3>
            </div>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-muted font-sans">
            <p><strong className="text-foreground">Cheating & Third-Party Tools:</strong> Use of wallhacks, auto-aim, speedhacks, modified config files, or network throttling will result in permanent device and account bans from all future circuits.</p>
            <p><strong className="text-foreground">Sportsmanship:</strong> Abusive behavior, toxicity, racism, or harassment toward players or tournament arbiters is strictly prohibited.</p>
            <p><strong className="text-foreground">Penalty Progression:</strong> First Offense: Official Warning or Point Deduction → Second Offense: Instant Match Disqualification → Severe Offense: Permanent Circuit Blacklist.</p>
          </div>
        </Card>

        {/* Section 6: No Rematch Policy */}
        <Card className="p-6 space-y-4 border border-warn/30 bg-warn/5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-warn/20 text-warn">
            <span className="w-8 h-8 rounded-lg bg-warn/20 text-warn font-black flex items-center justify-center text-sm font-mono border border-warn/40">
              06
            </span>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warn" />
              <h3 className="text-xl font-black text-foreground font-mono tracking-wide">
                Match Rules — No Rematch Policy
              </h3>
            </div>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm text-muted leading-relaxed font-sans">
            <div className="p-3 rounded-xl bg-warn/10 border border-warn/30 text-warn text-xs font-semibold mb-2">
              ⚠️ Strict Competitive Directive: Match schedules must run with zero delay. All participating teams acknowledge and agree to this policy prior to registration.
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Once a match starts, it CANNOT be replayed under any personal circumstances.</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Missing Teammates:</strong> If teammates fail to show up or enter room lobby prior to match countdown start → <strong className="text-danger">NO rematch will be granted</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Play With Available or Forfeit:</strong> The team must drop into the match with available players or submit a forfeit loss.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Team Disadvantage:</strong> Missing players or disconnected members are deemed internal squad risks, <strong className="text-danger">NOT a valid justification for a rematch</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Arbitration is Final:</strong> The appointed tournament admin's decision on match scores and outcomes is absolute and <strong className="text-foreground">FINAL</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Technical Exceptions Only:</strong> Only verified game server crashes, room bugging affecting all squads, or organizer-side technical failures can trigger an official match review.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Review Window:</strong> Official review inquiries must be filed with arbiters within <strong className="text-foreground font-mono">5 minutes</strong> of match conclusion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warn font-bold">•</span>
                <span><strong className="text-foreground">Quota:</strong> Maximum 1 review request per team per tournament season. Frivolous disputes will result in point penalties.</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-surface/75 backdrop-blur-md border border-border shadow-xl">
          <div>
            <h4 className="text-xl font-black text-foreground font-mono">Ready to Compete?</h4>
            <p className="text-xs text-muted font-sans">Review the rules with your squad and register your roster today.</p>
          </div>
          <Link to="/register">
            <Button variant="primary" size="md">
              <span>Register Squad Now →</span>
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 px-6 border-t border-border text-center text-xs text-muted bg-surface/75 backdrop-blur-md font-mono">
        © 2026 GS Arena. All Rights Reserved. Official Esports Rulebook.
      </footer>
    </div>
  );
}
