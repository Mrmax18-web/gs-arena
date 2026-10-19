import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import { SIDEBAR_STORAGE_KEY } from '../../lib/constants';
import { isAdmin, isCreator } from '../../lib/permissions';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { GameId } from '../../types/game';
import { useAppearance } from '../../hooks/useAppearance';

interface NavItemConfig {
  to: string;
  label: string;
  icon: string;
  requireAdmin?: boolean;
  requireCreator?: boolean;
  isCSOnly?: boolean;
}

const ADMIN_TOOLS_STORAGE_KEY = 'sidebar_admin_tools_open';
const MORE_OPTIONS_STORAGE_KEY = 'sidebar_more_options_open';

/**
 * Sidebar navigation component with cognitive UX optimizations:
 * - Law 6 (Choice Overload): Primary tasks surfaced first; Admin and secondary Creator/Utility tools
 *   grouped into collapsible, animated sections with localStorage state and auto-expansion on active routes.
 * - Law 2 (Figure and Ground): Clash Squad transition utilizes a high-contrast ConfirmDialog modal
 *   rather than blocking window.confirm.
 */
export const Sidebar: React.FC<{ mobileOpen: boolean; setMobileOpen: (open: boolean) => void }> = ({
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, role, signOut, isCreator: isCreatorClaim, loading, claimsLoaded } = useAuth();
  const { gameId, setGameId } = useGame();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [adminToolsOpen, setAdminToolsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(ADMIN_TOOLS_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [moreOptionsOpen, setMoreOptionsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(MORE_OPTIONS_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [showCSConfirm, setShowCSConfirm] = useState(false);

  // Auto-expand sections when navigating directly to a nested route
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setAdminToolsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname === '/creator' ||
      location.pathname === '/faq' ||
      location.pathname === '/contact'
    ) {
      setMoreOptionsOpen(true);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors in restrictive environments
      }
      return next;
    });
  };

  const toggleAdminTools = () => {
    setAdminToolsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ADMIN_TOOLS_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleMoreOptions = () => {
    setMoreOptionsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MORE_OPTIONS_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  // Primary navigation: core high-frequency player actions
  const primaryNavItems: NavItemConfig[] = [
    { to: '/leaderboard', label: 'Leaderboard', icon: 'solar:cup-star-bold' },
    { to: '/analytics', label: 'Analytics', icon: 'solar:chart-2-bold' },
    { to: '/registration', label: 'Registration', icon: 'solar:user-plus-bold' },
    { to: '/cs-standings', label: 'CS Standings', icon: 'solar:shield-bold', isCSOnly: true },
    { to: '/rules', label: 'Rules & Scoring', icon: 'solar:document-text-bold' },
  ];

  // Admin Tools (strictly RBAC protected: visible only to admin or creator)
  const adminNavItems: NavItemConfig[] = [];
  if (isAdmin(role) || isCreator(role)) {
    adminNavItems.push({
      to: '/admin',
      label: 'Admin Panel',
      icon: 'solar:settings-bold',
      requireAdmin: true,
    });
  }

  // Secondary Tools / Utilities
  const moreNavItems: NavItemConfig[] = [];
  if (!loading && claimsLoaded && (isCreator(role) || isCreatorClaim)) {
    moreNavItems.push({
      to: '/creator',
      label: 'Creator Console',
      icon: 'solar:lightbulb-bolt-bold',
      requireCreator: true,
    });
  }
  moreNavItems.push({ to: '/faq', label: 'FAQ', icon: 'solar:question-circle-bold' });
  moreNavItems.push({ to: '/contact', label: 'Contact Ops', icon: 'solar:chat-round-line-bold' });

  const handleCSClick = (e: React.MouseEvent) => {
    if (gameId !== 'FF_CS') {
      e.preventDefault();
      setShowCSConfirm(true);
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return 'solar:moon-bold';
    if (theme === 'light') return 'solar:sun-bold';
    return 'solar:laptop-bold';
  };

  const renderNavLink = (item: NavItemConfig) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={item.isCSOnly ? handleCSClick : undefined}
      aria-label={item.label}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:ring-2 ${
          item.requireCreator ? 'focus-visible:ring-amber-400' : 'focus-visible:ring-brand-500'
        } focus:outline-none ${
          isActive
            ? 'text-white'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
        } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`
      }
      title={collapsed && !mobileOpen ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="active-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-md shadow-red-600/20"
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <Icon
              icon={item.icon}
              aria-label={item.requireCreator ? 'Creator Console' : undefined}
              className={`text-lg shrink-0 ${
                item.requireCreator
                  ? 'text-amber-400 motion-safe:animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                  : ''
              }`}
            />
          </span>
          {(!collapsed || mobileOpen) && (
            <span className="relative z-10 truncate">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  const { appearance } = useAppearance();
  const [logoError, setLogoError] = useState(false);

  // Reset logoError if arenaLogoUrl changes
  useEffect(() => {
    setLogoError(false);
  }, [appearance.arenaLogoUrl]);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3 select-none">
      {/* Top Header & Brand */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 py-2">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            {appearance.arenaLogoUrl && !logoError ? (
              <img
                src={appearance.arenaLogoUrl}
                alt={appearance.siteName || 'GS Arena'}
                onError={() => setLogoError(true)}
                className="h-9 w-9 shrink-0 object-contain rounded-xl shadow-md"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-md shadow-red-600/20">
                <Icon icon="solar:cup-star-bold" className="text-xl" />
              </div>
            )}
            {(!collapsed || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  {appearance.siteName || (
                    <>
                      GS <span className="text-brand-500">ARENA</span>
                    </>
                  )}
                </span>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                  Esports Platform
                </p>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
          >
            <Icon
              icon={collapsed ? 'solar:alt-arrow-right-line-duotone' : 'solar:alt-arrow-left-line-duotone'}
              className="text-lg"
            />
          </button>
        </div>

        {/* Game Switcher Pill */}
        <div className="px-1">
          {(!collapsed || mobileOpen) ? (
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 p-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 mb-1">
                <span>Active Game</span>
                <span className="text-brand-500 font-bold">{gameId}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['BGMI', 'FF_BR', 'FF_CS'] as GameId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setGameId(id)}
                    className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                      gameId === id
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {id === 'FF_BR' ? 'FF BR' : id === 'FF_CS' ? 'FF CS' : 'BGMI'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              title={`Active game: ${gameId}`}
              onClick={() => {
                const next: GameId = gameId === 'BGMI' ? 'FF_BR' : gameId === 'FF_BR' ? 'FF_CS' : 'BGMI';
                setGameId(next);
              }}
              className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 text-xs font-bold text-brand-500 hover:border-brand-500 transition-colors"
            >
              {gameId === 'FF_BR' ? 'BR' : gameId === 'FF_CS' ? 'CS' : 'BG'}
            </div>
          )}
        </div>

        {/* Navigation Links with Choice Overload (Law 6) grouping */}
        <nav className="space-y-1 px-1">
          {/* Primary Nav Links */}
          {primaryNavItems.map(renderNavLink)}

          {/* Admin Tools Collapsible Section (Strict RBAC) */}
          {adminNavItems.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleAdminTools}
                aria-expanded={adminToolsOpen}
                aria-label="Toggle Admin Tools section"
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none ${
                  collapsed && !mobileOpen ? 'justify-center px-0' : ''
                }`}
                title={collapsed && !mobileOpen ? 'Admin Tools' : undefined}
              >
                <span className="flex items-center gap-2">
                  <Icon icon="solar:shield-keyhole-bold" className="text-sm text-red-500 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Admin Tools</span>}
                </span>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    animate={{ rotate: adminToolsOpen ? 180 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    <Icon icon="solar:alt-arrow-down-line-duotone" className="text-xs" />
                  </motion.div>
                )}
              </button>

              <AnimatePresence initial={false}>
                {adminToolsOpen && (
                  <motion.div
                    key="admin-tools-container"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1 pt-1"
                  >
                    {adminNavItems.map(renderNavLink)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* More Options Collapsible Section */}
          {moreNavItems.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleMoreOptions}
                aria-expanded={moreOptionsOpen}
                aria-label="Toggle More Options section"
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none ${
                  collapsed && !mobileOpen ? 'justify-center px-0' : ''
                }`}
                title={collapsed && !mobileOpen ? 'More Options' : undefined}
              >
                <span className="flex items-center gap-2">
                  <Icon icon="solar:menu-dots-bold" className="text-sm text-slate-400 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>More Options</span>}
                </span>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    animate={{ rotate: moreOptionsOpen ? 180 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    <Icon icon="solar:alt-arrow-down-line-duotone" className="text-xs" />
                  </motion.div>
                )}
              </button>

              <AnimatePresence initial={false}>
                {moreOptionsOpen && (
                  <motion.div
                    key="more-options-container"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1 pt-1"
                  >
                    {moreNavItems.map(renderNavLink)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Controls: Theme Toggle & Sign-In/Out */}
      <div className="space-y-2 border-t border-slate-200 dark:border-white/10 pt-3 px-1">
        {/* Theme button */}
        <button
          type="button"
          onClick={cycleTheme}
          aria-label={`Current theme: ${theme}. Click to change.`}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none ${
            collapsed && !mobileOpen ? 'justify-center px-0' : ''
          }`}
          title={`Theme: ${theme}`}
        >
          <Icon icon={getThemeIcon()} className="text-lg shrink-0 text-amber-500" />
          {(!collapsed || mobileOpen) && (
            <span className="capitalize">{theme} Theme</span>
          )}
        </button>

        {/* Auth control */}
        {user ? (
          <div className="space-y-1">
            {(!collapsed || mobileOpen) && (
              <div className="px-3 py-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="block truncate font-medium text-slate-700 dark:text-slate-200">
                  {user.displayName || user.email || 'Verified User'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                  Role: {role}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut()}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none ${
                collapsed && !mobileOpen ? 'justify-center px-0' : ''
              }`}
              title="Sign Out"
            >
              <Icon icon="solar:logout-2-bold" className="text-lg shrink-0" />
              {(!collapsed || mobileOpen) && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none ${
              collapsed && !mobileOpen ? 'justify-center px-0' : ''
            }`}
            title="Sign In"
          >
            <Icon icon="solar:login-2-bold" className="text-lg shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign In</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
        className="hidden md:block fixed inset-y-0 left-0 z-30 glass-sidebar shadow-2xl h-screen"
        style={{
          backgroundColor: 'rgba(10, 10, 15, 0.4)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              aria-hidden="true"
            />
            {/* Mobile Drawer Panel */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 w-64 z-50 glass-sidebar shadow-2xl"
              style={{
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(32px)',
              }}
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Dialog for Clash Squad Mode Switch (Figure & Ground - Law 2) */}
      <ConfirmDialog
        isOpen={showCSConfirm}
        title="Switch to Clash Squad"
        message="Clash Squad standings are designed specifically for Free Fire Clash Squad mode. Would you like to switch the active game to Free Fire Clash Squad now?"
        confirmText="Switch to FF CS"
        cancelText="Stay Here"
        variant="primary"
        onConfirm={() => {
          setShowCSConfirm(false);
          setGameId('FF_CS');
          navigate('/cs-standings');
        }}
        onClose={() => setShowCSConfirm(false)}
      />
    </>
  );
};
