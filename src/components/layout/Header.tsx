import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Laptop, User, LogOut, ShieldCheck } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCreator } from '../../hooks/useCreator';
import { MorphTabs, type TabItem } from '../ui/MorphTabs';
import { OrbitCoreIcon } from '../ui/OrbitCoreIcon';
import { IconCreatorBulb } from '../../lib/icons';
import { cn } from '../../lib/cn';
import type { Game } from '../../types';

/**
 * Returns formatted broadcast breadcrumb from the active pathname.
 */
function getBreadcrumbTitle(pathname: string): { section: string; title: string } {
  if (pathname === '/' || pathname === '/leaderboard' || pathname === '/public' || pathname === '/landing') {
    return { section: 'CIRCUIT', title: 'LEADERBOARD' };
  }
  if (pathname.startsWith('/analytics')) {
    return { section: 'TELEMETRY', title: 'ANALYTICS' };
  }
  if (pathname.startsWith('/rules')) {
    return { section: 'RULEBOOK', title: 'REGULATIONS' };
  }
  if (pathname.startsWith('/faq')) {
    return { section: 'SUPPORT', title: 'FAQ & HELP' };
  }
  if (pathname.startsWith('/contact')) {
    return { section: 'SUPPORT', title: 'CONTACT' };
  }
  if (pathname.startsWith('/registration') || pathname.startsWith('/register')) {
    return { section: 'REGISTRATION', title: 'ROSTER REGISTRATION' };
  }
  if (pathname.startsWith('/approvals')) {
    return { section: 'ADMIN', title: 'APPROVAL QUEUE' };
  }
  if (pathname.startsWith('/matches')) {
    return { section: 'BROADCAST', title: 'MATCH RESULTS' };
  }
  if (pathname.startsWith('/cs-standings')) {
    return { section: 'CLASH SQUAD', title: 'STANDINGS' };
  }
  if (pathname.startsWith('/cs-bracket') || pathname.startsWith('/cs-playoffs')) {
    return { section: 'CLASH SQUAD', title: 'TOURNAMENT BRACKET' };
  }
  if (pathname.startsWith('/cs-groups')) {
    return { section: 'CLASH SQUAD', title: 'GROUP MANAGER' };
  }
  if (pathname.startsWith('/activity')) {
    return { section: 'AUDIT', title: 'ACTIVITY LOG' };
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/data')) {
    return { section: 'SYSTEM', title: 'ADMIN SETTINGS' };
  }
  if (pathname.startsWith('/creator')) {
    return { section: 'CREATOR', title: 'CONSOLE' };
  }
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return { section: 'ACCESS', title: 'AUTHENTICATION' };
  }
  return { section: 'ARENA', title: 'OVERVIEW' };
}

/**
 * Broadcast Noir Header.
 * Features:
 * - Left: Monospace broadcast breadcrumb title
 * - Right: Game switcher (MorphTabs), Theme switcher (MorphTabs 3-segment),
 *   Creator bulb indicator, 32px 3D Orbit Core icon, and accessible user avatar menu.
 */
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentGame, setCurrentGame } = useGame();
  const { mode, setMode } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const { isCreatorUnlocked } = useCreator();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const breadcrumb = getBreadcrumbTitle(location.pathname);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gameTabs: TabItem[] = [
    { id: 'bgmi', label: 'BGMI' },
    { id: 'freefire', label: 'FREE FIRE' },
  ];

  const themeTabs: TabItem[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-surface/80 backdrop-blur-xl border-b border-border select-none"
    >
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase text-muted truncate">
          GS ARENA // {breadcrumb.section}
        </span>
        <span className="text-muted/40 text-xs">/</span>
        <h1 className="font-mono text-sm sm:text-base font-bold tracking-tight text-foreground uppercase truncate">
          {breadcrumb.title}
        </h1>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Game Switcher */}
        <div className="hidden sm:block">
          <MorphTabs
            tabs={gameTabs}
            value={currentGame}
            onChange={(v) => setCurrentGame(v as Game)}
            variant="segmented"
            density="compact"
            aria-label="Tournament Game Selection"
          />
        </div>

        {/* Theme Switcher */}
        <div className="hidden md:block">
          <MorphTabs
            tabs={themeTabs}
            value={mode}
            onChange={(v) => setMode(v as ThemeMode)}
            variant="segmented"
            density="compact"
            aria-label="Theme Mode Selection"
          />
        </div>

        {/* Creator Lightbulb */}
        {isCreatorUnlocked && (
          <Link
            to="/creator"
            aria-label="Open Creator Console"
            title="Creator Console Unlocked"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(255,176,32,0.3)] animate-pulse transition-transform hover:scale-105"
          >
            <IconCreatorBulb size={17} />
          </Link>
        )}

        {/* 32px 3D Orbit Core Icon */}
        <div className="shrink-0 flex items-center justify-center">
          <OrbitCoreIcon size={32} />
        </div>

        {/* User Avatar Menu */}
        <div ref={menuRef} className="relative">
          {user ? (
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="User Account Menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-1.5 p-1 rounded-full border border-border bg-surface-2 hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-mono font-bold">
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3 py-1 rounded-[6px] border border-border bg-surface-2/80 hover:border-accent/40 text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors"
            >
              Sign In
            </button>
          )}

          {/* User Dropdown */}
          {user && userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface/95 backdrop-blur-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground truncate">
                  {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />}
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="font-mono text-[10px] text-muted uppercase mt-0.5">
                  {isAdmin ? 'Administrator' : 'Spectator'}
                </div>
              </div>

              <div className="py-1">
                {isAdmin && (
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface-2/60 transition-colors"
                  >
                    Admin Settings
                  </Link>
                )}
                {isCreatorUnlocked && (
                  <Link
                    to="/creator"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    Creator Console
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-danger hover:bg-danger/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
