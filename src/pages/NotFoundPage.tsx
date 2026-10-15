import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, Trophy, ArrowLeft } from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col items-center justify-center p-4">
      <CosmicBackground />

      <Card className="relative z-10 w-full max-w-lg p-8 sm:p-10 text-center border border-white/15 space-y-6 bg-black/70 shadow-2xl">
        <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
          <Search className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block mb-3">
            ERROR 404
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-['Teko',sans-serif] tracking-wider leading-none">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-300 max-w-sm mx-auto mt-3 leading-relaxed">
            The tournament arena or page you're looking for doesn't exist, has expired, or has been relocated to another sector.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link to="/leaderboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <Trophy className="w-4 h-4 mr-2 text-amber-400" />
              <span>View Leaderboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
