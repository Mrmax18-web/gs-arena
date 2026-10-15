import React, { useState, useId } from 'react';
import { Link, useLocation, matchPath, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCreator } from '../../hooks/useCreator';
import {
  StarburstLogo,
  IconRanking,
  IconChart,
  IconDocument,
  IconHelp,
  IconUserPlus,
  IconApprovals,
  IconMatches,
  IconStandings,
  IconBracket,
  IconGroups,
  IconActivity,
  IconSettings,
  IconCreatorBulb,
  IconLogout,
} from '../../lib/icons';
import { cn } from '../../lib/cn';
import type { Game } from '../../types';

export interface SidebarProps {
  currentGame?: Game;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  matchPatterns: string[];
  icon: (props: { className?: string; size?: number }) => React.ReactElement;
  adminOnly?: boolean;
  creatorOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // Public Section
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    path: '/',
    matchPatterns: ['/', '/leaderboard', '/public', '/landing'],
    icon: IconRanking,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    matchPatterns: ['/analytics'],
    icon: IconChart,
  },
  {
    id: 'rules',
    label: 'Rules',
    path: '/rules',
    matchPatterns: ['/rules'],
    icon: IconDocument,
  },
  {
    id: 'faq',
    label: 'FAQ',
    path: '/faq',
    matchPatterns: ['/faq'],
    icon: IconHelp,
  },

  // BR Management (Admin)
  {
    id: 'registration',
    label: 'Registration',
    path: '/registration',
    matchPatterns: ['/registration', '/admin/registration', '/register'],
    icon: IconUserPlus,
    adminOnly: true,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    path: '/approvals',
    matchPatterns: ['/approvals', '/admin/approvals'],
    icon: IconApprovals,
    adminOnly: true,
  },
  {
    id: 'matches',
    label: 'Matches',
    path: '/matches',
    matchPatterns: ['/matches', '/admin/matches', '/cs-results'],
    icon: IconMatches,
    adminOnly: true,
  },

  // Clash Squad Management (Admin/Public Standings)
  {
    id: 'cs-standings',
    label: 'CS Standings',
    path: '/cs-standings',
    matchPatterns: ['/cs-standings'],
    icon: IconStandings,
  },
  {
    id: 'cs-bracket',
    label: 'CS Bracket',
    path: '/cs-bracket',
    matchPatterns: ['/cs-bracket', '/cs-playoffs'],
    icon: IconBracket,
  },
  {
    id: 'cs-groups',
    label: 'CS Groups',
    path: '/cs-groups',
    matchPatterns: ['/cs-groups'],
    icon: IconGroups,
    adminOnly: true,
  },

  // Audit & Settings (Admin)
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    matchPatterns: ['/activity', '/admin/activity'],
    icon: IconActivity,
    adminOnly: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    matchPatterns: ['/settings', '/admin/settings', '/admin/data', '/request-admin'],
    icon: IconSettings,
    adminOnly: true,
  },

  // Creator
  {
    id: 'creator',
    label: 'Creator Console',
    path: '/creator',
    matchPatterns: ['/creator'],
    icon: IconCreatorBulb,
    creatorOnly: true,
  },
];

/**
 * Matches the current pathname to a navigation item ID using route patterns.
 */
export function getActiveNavItemId(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    for (const pattern of item.matchPatterns) {
      if (matchPath({ path: pattern, end: true }, pathname)) {
        return item.id;
      }
    }
  }
  return null;
}

/**
 * REFERENCE-A Dark Rail Sidebar.
 * Fixed 76px desktop rail (#000000) with active breakout pill (88x52px),
 * 2px accent ring, and concave fillets melting into the rail.
 * Mobile (<768px): 56px bottom bar with primary items and swipeable More drawer.
 */
export function Sidebar({ currentGame: _unused }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { isCreatorUnlocked } = useCreator();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const activeItemId = getActiveNavItemId(location.pathname);

  const hasAdmin = isAdmin || isCreatorUnlocked;

  // Filter accessible items based on user role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.creatorOnly) return isCreatorUnlocked;
    if (item.adminOnly) return hasAdmin;
    return true;
  });

  // Mobile bottom bar top 5 items
  const mobilePrimaryItems = visibleItems.slice(0, 4);
  const mobileMoreItems = visibleItems.slice(4);

  return (
    <>
      {/* ━━━ DESKTOP RAIL (>= 768px) ━━━ */}
      <aside
        aria-label="Main sidebar navigation"
        className="hidden md:flex fixed top-0 left-0 bottom-0 w-[76px] z-40 flex-col items-center justify-between py-5 bg-[#000000] border-r border-white/[0.06] select-none"
      >
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center w-full">
          <Link
            to="/"
            aria-label="GS Arena Home"
            className="group flex items-center justify-center w-12 h-12 rounded-full text-accent transition-transform hover:scale-105 active:scale-95"
          >
            <StarburstLogo size={30} className="transition-transform duration-300 group-hover:rotate-45" />
          </Link>
          <div className="w-8 h-[1px] bg-white/[0.08] my-3" />
        </div>

        {/* Middle Navigation Items */}
        <nav className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
          {visibleItems.map((item) => {
            const isActive = item.id === activeItemId;
            const isCreatorItem = item.id === 'creator';
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group w-full flex justify-center py-0.5">
                {/* Active Breakout Pill with Concave Fillets */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                      mass: 0.9,
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[88px] h-[52px] rounded-r-full bg-[#000000] border-2 border-accent shadow-[0_0_20px_var(--accent-glow)] z-10 pointer-events-none"
                  >
                    {/* Top Concave Fillet (Inverse Radius melting into rail) */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-[20px] left-0 w-[20px] h-[20px] pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at 100% 0%, transparent 19px, #000000 20px)',
                      }}
                    />

                    {/* Bottom Concave Fillet (Inverse Radius melting into rail) */}
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-[20px] left-0 w-[20px] h-[20px] pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at 100% 100%, transparent 19px, #000000 20px)',
                      }}
                    />
                  </motion.div>
                )}

                {/* Nav Link Icon */}
                <Link
                  to={item.path}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative z-20 flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-150',
                    isCreatorItem && !isActive && 'text-[#FFB020] animate-pulse',
                    isActive
                      ? 'text-white scale-105'
                      : 'text-slate-400/60 hover:text-white hover:scale-105'
                  )}
                >
                  <Icon size={20} className="stroke-[1.8]" />

                  {/* Micro Glass Tooltip (Reference-A/B style) */}
                  <div className="pointer-events-none absolute left-[74px] px-2.5 py-1 rounded-[6px] border border-white/10 bg-black/90 backdrop-blur-md text-[11px] font-mono uppercase tracking-[0.14em] text-white opacity-0 -translate-x-2 transition-all duration-150 delay-150 group-hover:opacity-100 group-hover:translate-x-0 shadow-xl whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom Utility Actions */}
        <div className="flex flex-col items-center w-full gap-2 pt-2 border-t border-white/[0.08]">
          {/* Help */}
          <Link
            to="/faq"
            aria-label="FAQ & Help"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400/60 hover:text-white transition-colors"
          >
            <IconHelp size={18} />
          </Link>

          {/* Sign out (if signed in) or Sign In button */}
          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Sign Out"
              title="Sign Out"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400/60 hover:text-danger transition-colors"
            >
              <IconLogout size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              aria-label="Admin Sign In"
              title="Sign In"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono text-slate-300 hover:text-white hover:border-accent"
            >
              ADM
            </button>
          )}
        </div>
      </aside>

      {/* ━━━ MOBILE BOTTOM BAR (< 768px) ━━━ */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#000000]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none"
      >
        {mobilePrimaryItems.map((item) => {
          const isActive = item.id === activeItemId;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              aria-label={item.label}
              className={cn(
                'relative flex flex-col items-center justify-center w-14 h-12 transition-colors',
                isActive ? 'text-accent' : 'text-slate-400/60'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileActiveBar"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute top-0 inset-x-2 h-0.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent-glow)]"
                />
              )}
              <Icon size={20} />
              <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5 truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open more navigation options"
          className="relative flex flex-col items-center justify-center w-14 h-12 text-slate-400/60 hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5">More</span>
        </button>
      </nav>

      {/* ━━━ MOBILE MORE DRAWER ━━━ */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="relative w-full max-h-[75vh] bg-[#0A0A0A] border-t border-white/10 rounded-t-2xl p-5 overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  Navigation Menu
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {visibleItems.map((item) => {
                  const isActive = item.id === activeItemId;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border font-mono text-xs uppercase tracking-wider transition-colors',
                        isActive
                          ? 'border-accent bg-accent/10 text-white font-bold'
                          : 'border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      )}
                    >
                      <Icon size={18} className={isActive ? 'text-accent' : 'text-slate-400'} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom user actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 text-danger text-xs font-mono uppercase tracking-wider"
                  >
                    <IconLogout size={16} />
                    Sign Out ({user.email?.split('@')[0]})
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-2 text-accent text-xs font-mono uppercase tracking-wider"
                  >
                    Admin Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
