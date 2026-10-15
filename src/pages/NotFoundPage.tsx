import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Trophy, Radio } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TagChip } from '../components/ui/TagChip';

/**
 * 404 Error page featuring broadcast-grade "SIGNAL LOST" glitch aesthetic.
 * Renders centered over the global WebGL ribbon with graceful reduced-motion fallbacks.
 */
export function NotFoundPage() {
  return (
    <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center p-4">
      <Card className="relative z-10 w-full max-w-lg p-8 sm:p-12 text-center border border-border bg-surface/80 backdrop-blur-2xl shadow-2xl rounded-3xl space-y-6">
        {/* Signal indicator */}
        <div className="w-16 h-16 rounded-2xl bg-danger/15 border border-danger/30 flex items-center justify-center mx-auto text-danger">
          <Radio className="w-8 h-8 motion-safe:animate-pulse" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <TagChip label="SIGNAL LOST" variant="danger" size="sm" />
            <TagChip label="FEED DISRUPTED" variant="warn" size="sm" />
          </div>

          {/* Broadcast Glitch Heading */}
          <div className="relative inline-block select-none my-2">
            <span
              className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-foreground block drop-shadow-[0_0_20px_rgba(255,59,78,0.3)] motion-safe:animate-pulse"
              aria-label="404"
            >
              404
            </span>
            <div
              className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
              }}
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-foreground font-mono tracking-wider uppercase mt-1">
            Sector Telemetry Lost
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto mt-2 leading-relaxed font-sans">
            The tournament transmission frequency or arena page you requested could not be resolved. All telemetry packets timed out.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto font-mono">
              <Home className="w-4 h-4 mr-2" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link to="/leaderboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto font-mono border-border">
              <Trophy className="w-4 h-4 mr-2 text-accent" />
              <span>Scoreboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
