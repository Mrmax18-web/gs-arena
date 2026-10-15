import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  BarChart3,
  Swords,
  Lock,
  Globe,
  LogIn,
  Gamepad2,
  Flame,
  KeyRound,
  Share2,
  Check,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { TournamentProvider } from '../context/TournamentContext';
import { useCreator } from '../hooks/useCreator';
import { useAuth } from '../context/AuthContext';
import { verifyPublicPassword } from '../lib/creator';
import { copyToClipboard } from '../lib/clipboard';
import { LeaderboardPage } from './LeaderboardPage';
import { AnalyticsPage } from './AnalyticsPage';
import { CSBracketPage } from './CSBracketPage';
import { CSLeagueStandingsPage } from './CSLeagueStandingsPage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/cn';
import type { Game } from '../types';

export function PublicViewerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { config, loading } = useCreator();
  const { isAdmin, openLoginModal } = useAuth();

  // Initialize selected game from URL search param, localStorage, or fallback to BGMI
  const [selectedGame, setSelectedGame] = useState<Game>(() => {
    const urlGame = searchParams.get('game');
    if (urlGame === 'BGMI' || urlGame === 'Free Fire') {
      return urlGame;
    }
    try {
      const saved = localStorage.getItem('ttp_game');
      if (saved === 'BGMI' || saved === 'Free Fire') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'BGMI';
  });

  // Active tab state with support for URL deep-linking
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics' | 'bracket' | 'cs-standings'>(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'leaderboard' || urlTab === 'analytics' || urlTab === 'bracket' || urlTab === 'cs-standings') {
      return urlTab;
    }
    return 'leaderboard';
  });

  // Password gate state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passError, setPassError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync game and tab when URL search parameters change externally
  useEffect(() => {
    const urlGame = searchParams.get('game');
    if ((urlGame === 'BGMI' || urlGame === 'Free Fire') && urlGame !== selectedGame) {
      setSelectedGame(urlGame);
    }
    const urlTab = searchParams.get('tab');
    if (
      (urlTab === 'leaderboard' || urlTab === 'analytics' || urlTab === 'bracket' || urlTab === 'cs-standings') &&
      urlTab !== activeTab
    ) {
      setActiveTab(urlTab);
    }
  }, [searchParams, selectedGame, activeTab]);

  // Handle password requirement status
  useEffect(() => {
    if (!loading) {
      if (!config?.publicPasswordRequired) {
        setIsUnlocked(true);
      }
    }
  }, [config, loading]);

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    try {
      localStorage.setItem('ttp_game', game);
    } catch {
      // ignore
    }
    // Reset invalid Free Fire tabs if switching to BGMI
    const targetTab = game === 'BGMI' && (activeTab === 'bracket' || activeTab === 'cs-standings') ? 'leaderboard' : activeTab;
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('game', game);
      next.set('tab', targetTab);
      return next;
    });
  };

  const handleSelectTab = (tab: 'leaderboard' | 'analytics' | 'bracket' | 'cs-standings') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.set('game', selectedGame);
      return next;
    });
  };

  const handleCopyShareLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `/public?game=${encodeURIComponent(selectedGame)}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPassError('Please enter access passkey');
      return;
    }
    const valid = await verifyPublicPassword(passwordInput);
    if (valid) {
      setIsUnlocked(true);
      setPassError(null);
    } else {
      setPassError('Incorrect access password. Please try again.');
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#03040a] text-white flex flex-col justify-center items-center p-6 text-center">
        <CosmicBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-300 font-mono tracking-wider uppercase">Loading Public Standings...</p>
        </div>
      </div>
    );
  }

  // Disabled Screen
  if (!loading && config && config.publicViewerEnabled === false && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#03040a] text-white flex flex-col justify-center items-center p-6 text-center">
        <CosmicBackground />
        <Card className="relative z-10 max-w-md p-8 border border-white/10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-['Teko',sans-serif] text-3xl">
            Public Viewing Disabled
          </h2>
          <p className="text-xs text-gray-400">
            Public viewing is currently disabled by the tournament administrator. Please check back later or log in to manage settings.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Go to Arena</span>
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => openLoginModal()}>
              <LogIn className="w-3.5 h-3.5 mr-1" />
              <span>Admin Sign In</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Password Protected Gate
  if (!loading && config?.publicPasswordRequired && !isUnlocked && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#03040a] text-white flex flex-col justify-center items-center p-6 text-center">
        <CosmicBackground />
        <Card className="relative z-10 max-w-md w-full p-8 border border-white/15 space-y-5 text-left">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400 text-center">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black font-['Teko',sans-serif] text-3xl uppercase tracking-wide text-white">
              Password Protected Viewer
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Please enter the tournament access password to view live statistics and brackets.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Viewer Passkey"
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              error={passError || undefined}
              autoFocus
            />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              <KeyRound className="w-4 h-4" />
              <span>Unlock Live Standings</span>
            </Button>
          </form>
          <div className="pt-2 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Return to Main Portal
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <TournamentProvider key={selectedGame} game={selectedGame}>
      <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col justify-between">
        <CosmicBackground />

        {/* Minimal Public Header */}
        <header className="relative z-20 w-full px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-500/20 bg-black/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3.5 group" title="Return to Main Arena">
              {/* GS Arena Logo */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
                <img
                  src="/gs-arena-logo.png"
                  alt="GS Arena"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fb = (e.target as HTMLElement).parentElement?.querySelector('.pv-logo-fb') as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }}
                  className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl object-contain bg-black/60 p-1 border border-orange-500/30 drop-shadow-[0_0_12px_rgba(255,107,53,0.5)]"
                />
                <div className="pv-logo-fb hidden w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 p-0.5 border border-orange-500/40 items-center justify-center">
                  <div className="w-full h-full rounded-[10px] bg-black/80 flex items-center justify-center">
                    <span className="text-white font-black font-['Teko',sans-serif] text-xl md:text-2xl tracking-wider">
                      GS
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black font-['Teko',sans-serif] tracking-tight leading-none uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-[0_0_12px_rgba(255,107,53,0.3)] flex items-center gap-2">
                  GS ARENA
                  <span className="text-[10px] uppercase font-sans font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PUBLIC VIEWER
                  </span>
                </h1>
                <p className="flex items-center gap-2 text-xs md:text-sm text-white/60 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Spectator Feed
                  <span className="text-white/30">•</span>
                  Real-Time Standings
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Game Selector */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleSelectGame('BGMI')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  selectedGame === 'BGMI'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>BGMI</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectGame('Free Fire')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  selectedGame === 'Free Fire'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Free Fire</span>
              </button>
            </div>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="text-xs text-slate-200 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Copy Spectator Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>

            {/* Admin or Portal Return */}
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => openLoginModal()}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            ) : (
              <Link
                to="/"
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-2 rounded-xl border border-orange-500/30 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="relative z-15 w-full border-b border-white/10 bg-black/40 backdrop-blur-sm px-4 sm:px-6 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectTab('leaderboard')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                activeTab === 'leaderboard'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab('analytics')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                activeTab === 'analytics'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            {selectedGame === 'Free Fire' && (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectTab('cs-standings')}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                    activeTab === 'cs-standings'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>CS Group Standings</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('bracket')}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                    activeTab === 'bracket'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Clash Squad Bracket</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Viewer Body */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
          {activeTab === 'leaderboard' && <LeaderboardPage propGame={selectedGame} />}
          {activeTab === 'analytics' && <AnalyticsPage propGame={selectedGame} />}
          {activeTab === 'cs-standings' && selectedGame === 'Free Fire' && <CSLeagueStandingsPage propGame={selectedGame} />}
          {activeTab === 'bracket' && selectedGame === 'Free Fire' && <CSBracketPage propGame={selectedGame} />}
        </main>

        <footer className="relative z-20 w-full py-4 px-6 border-t border-white/10 text-center text-xs text-gray-500 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>Powered by GS Arena • Real-Time Cloud Spectator Feed</span>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-amber-400 hover:text-amber-300 transition-colors">
              Tournament Portal
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/register" className="text-slate-400 hover:text-white transition-colors">
              Squad Registration
            </Link>
          </div>
        </footer>
      </div>
    </TournamentProvider>
  );
}
