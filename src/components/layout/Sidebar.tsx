import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Trophy,
  BarChart3,
  UserPlus,
  CheckSquare,
  CreditCard,
  Swords,
  Settings,
  Shield,
  Database,
  Menu,
  X,
  Flame,
  Gamepad2,
  Check,
  FileText,
  HelpCircle,
  Headphones,
  History,
  Globe,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { SidebarUserIcon } from '../SidebarUserIcon';
import { CreatorBulb } from '../creator/CreatorDot';
import { copyToClipboard } from '../../lib/clipboard';
import { useBranding } from '../../hooks/useBranding';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { cn } from '../../lib/cn';
import type { Game } from '../../types';

export interface SidebarProps {
  currentGame?: Game;
}

export function Sidebar({ currentGame: propCurrentGame }: SidebarProps) {
  const { currentGame: contextCurrentGame, currentMode, clearGame } = useGame();
  const currentGame = propCurrentGame || contextCurrentGame;
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { branding } = useBranding();
  const connectionStatus = useConnectionStatus();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    try {
      const regQ = query(
        collection(db, 'registrations'),
        where('status', '==', 'pending'),
        where('game', '==', currentGame)
      );
      const unsubReg = onSnapshot(
        regQ,
        (snap) => {
          setPendingApprovalsCount(snap.size);
        },
        () => {}
      );

      return () => {
        unsubReg();
      };
    } catch {
      // Graceful fallback if collections not initialized
    }
  }, [isAdmin, currentGame]);

  const handleCopyPublicUrl = async () => {
    const gameParam = currentGame ? `?game=${encodeURIComponent(currentGame)}` : '';
    const url = typeof window !== 'undefined' ? `${window.location.origin}/public${gameParam}` : `/public${gameParam}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedPublicUrl(true);
      setTimeout(() => setCopiedPublicUrl(false), 2500);
    }
  };

  const navItems = [
    {
      to: '/leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      adminOnly: false,
    },
    {
      to: '/register',
      label: 'Register Squad',
      icon: UserPlus,
      adminOnly: false,
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      adminOnly: false,
    },
    {
      to: `/public?game=${encodeURIComponent(currentGame)}`,
      label: 'Public Viewer',
      icon: Globe,
      adminOnly: false,
    },
    {
      to: '/rules',
      label: 'Rules',
      icon: FileText,
      adminOnly: false,
    },
    {
      to: '/faq',
      label: 'FAQ & Help',
      icon: HelpCircle,
      adminOnly: false,
    },
    {
      to: '/contact',
      label: 'Contact',
      icon: Headphones,
      adminOnly: false,
    },
    {
      to: '/request-admin',
      label: 'Request Admin',
      icon: ShieldAlert,
      adminOnly: false,
    },
    {
      to: '/registration',
      label: 'Registration Mgmt',
      icon: Shield,
      adminOnly: true,
    },
    {
      to: '/approvals',
      label: 'Approval Queue',
      icon: CheckSquare,
      adminOnly: true,
      badge: pendingApprovalsCount,
    },
    {
      to: '/matches',
      label: 'Match Results',
      icon: Swords,
      adminOnly: true,
    },
    {
      to: '/activity',
      label: 'Activity Log',
      icon: History,
      adminOnly: true,
    },
    {
      to: '/admin/data',
      label: 'Data & Backup',
      icon: Database,
      adminOnly: true,
    },
    {
      to: '/settings',
      label: 'Admin Settings',
      icon: Settings,
      adminOnly: true,
    },
  ];

  const csNavItems = [
    {
      to: '/cs-standings',
      label: 'CS Standings',
      icon: Trophy,
      adminOnly: false,
    },
    {
      to: '/cs-bracket',
      label: 'CS Bracket',
      icon: Swords,
      adminOnly: false,
    },
    {
      to: '/cs-playoffs',
      label: 'CS Finals Tree',
      icon: Flame,
      adminOnly: false,
    },
    {
      to: '/cs-groups',
      label: 'CS Group Manager',
      icon: CheckSquare,
      adminOnly: true,
    },
    {
      to: '/cs-results',
      label: 'CS Match Results',
      icon: Swords,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const visibleCSNavItems = csNavItems.filter((item) => !item.adminOnly || isAdmin);

  const brandName = branding.brandName || 'GS ARENA';
  const logoSrc = branding.headerLogo || '/gs-arena-logo.png';
  const brandTagline = branding.brandTagline || 'Esports Circuit';
  const initials = brandName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'GS';

  const sidebarContent = (
    <div className="relative flex flex-col h-full justify-between">
      {/* Top Header & Branding */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-1 min-w-0">
            <div className="relative shrink-0">
              <img
                src={logoSrc}
                alt={brandName}
                className="w-10 h-10 rounded-lg object-contain bg-black/60 p-0.5 border border-orange-500/30 drop-shadow-[0_0_8px_rgba(255,107,53,0.4)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fb = (e.target as HTMLElement).parentElement?.querySelector('.sidebar-logo-fb') as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div className="sidebar-logo-fb hidden w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 items-center justify-center text-white font-black text-xs font-['Teko',sans-serif] text-base">
                {initials}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent font-['Teko',sans-serif] text-2xl leading-none truncate">
                {brandName}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5 mt-0.5 truncate">
                <span className="truncate">{brandTagline}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <SidebarUserIcon />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Arena badge (display-only with Change link) */}
        <div className="mt-4 px-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Current Arena
          </div>
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
              currentGame === 'BGMI'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <img
              src={currentGame === 'BGMI' ? '/bgmi-icon.png' : '/freefire-icon.png'}
              alt={currentGame}
              className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <span className="text-sm font-bold block leading-tight truncate">
                {currentGame === 'BGMI'
                  ? 'BGMI'
                  : currentMode === 'CS'
                  ? 'Free Fire · Clash Squad'
                  : 'Free Fire · Battle Royale'}
              </span>
              <span className="text-[10px] text-white/50 block font-mono">
                {currentGame === 'BGMI'
                  ? 'Battlegrounds BR'
                  : currentMode === 'CS'
                  ? '4v4 Best-of-7 League'
                  : '12 Squads Survival'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearGame();
                navigate('/');
              }}
              className="ml-auto text-xs font-semibold underline opacity-75 hover:opacity-100 hover:text-white transition-opacity py-1 px-1 cursor-pointer shrink-0"
              title="Change arena on the 3D showcase landing"
            >
              Change
            </button>
          </div>
        </div>

        {/* Main Navigation List */}
        <div className="mt-4">
          <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 block">
            Navigation
          </label>
          <nav aria-label="Main tournament navigation" className="flex flex-col space-y-0.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all group duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 to-transparent text-amber-300 border border-orange-500/30 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-gradient-to-b from-orange-400 to-amber-500" />
                      )}
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors',
                            isActive ? 'text-amber-300' : 'text-slate-300 group-hover:text-white'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.adminOnly && (
                          <span className="text-xs font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                        {typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white min-w-4 text-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Clash Squad Section for Free Fire */}
        {currentGame === 'Free Fire' && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold tracking-wider text-rose-300 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Clash Squad Arena
              </label>
              <span className="text-xs font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                CS LEAGUE
              </span>
            </div>
            <nav aria-label="Clash Squad league navigation" className="flex flex-col space-y-0.5">
              {visibleCSNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center justify-between px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-all group duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-rose-500/20 to-transparent text-rose-300 border border-rose-500/30 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-gradient-to-b from-rose-400 to-red-500" />
                        )}
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'w-3.5 h-3.5 transition-colors',
                              isActive ? 'text-rose-300' : 'text-slate-300 group-hover:text-white'
                            )}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.adminOnly && (
                          <span className="text-xs font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Area with Public URL Link & Discrete Creator Bulb */}
      <div className="relative pt-3 mt-4 border-t border-white/10">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-400" />
              Public Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <NavLink
              to={`/public?game=${encodeURIComponent(currentGame)}`}
              onClick={() => setMobileOpen(false)}
              className="flex-1 px-3 py-2.5 min-h-[44px] rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-amber-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Open Public Viewer"
            >
              <span>Public Viewer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </NavLink>

            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy Public Viewer Link"
              aria-label="Copy public viewer link"
            >
              {copiedPublicUrl ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {copiedPublicUrl && (
            <p className="text-[10px] text-emerald-400 font-mono text-center">
              Public link copied to clipboard!
            </p>
          )}

          {/* Connection Status & Force Sync */}
          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'online'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : connectionStatus === 'offline'
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-[11px] text-white/50 font-medium">
                {connectionStatus === 'online'
                  ? 'Connected'
                  : connectionStatus === 'offline'
                  ? 'Offline'
                  : 'Connecting...'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                console.log('[Sync] Force reloading page to synchronize Firestore and local cache...');
                window.location.reload();
              }}
              className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center gap-1 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white/5"
              title="Force reload all real-time data across tabs and devices"
            >
              <RefreshCw className="w-2.5 h-2.5 text-orange-400" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 right-0">
          <CreatorBulb />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#0a0c16]/95 backdrop-blur-xl border-b border-orange-500/20">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={logoSrc}
              alt={brandName}
              className="w-8 h-8 rounded-lg object-contain bg-black/60 p-0.5 border border-orange-500/30"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fb = (e.target as HTMLElement).parentElement?.querySelector('.mobile-logo-fb') as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div className="mobile-logo-fb hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 items-center justify-center text-white font-black text-xs font-['Teko',sans-serif] text-sm">
              {initials}
            </div>
          </div>
          <span className="font-black text-white text-base tracking-wider font-['Teko',sans-serif] text-xl leading-none uppercase bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent truncate max-w-[180px]">
            {brandName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SidebarUserIcon />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 h-screen sticky top-0 bg-[#070913]/90 backdrop-blur-xl border-r border-white/10 p-4 z-20 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full bg-[#070913]/95 backdrop-blur-2xl border-r border-white/15 p-4 z-10 overflow-y-auto shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
