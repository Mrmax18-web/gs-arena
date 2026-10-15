import React, { Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { GameProvider } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';


import { LeaderboardPage } from './pages/LeaderboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { MatchResultsPage } from './pages/MatchResultsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminDataPage } from './pages/AdminDataPage';

// Clash Squad Pages
import { CSGroupManagerPage } from './pages/CSGroupManagerPage';
import { CSBracketPage } from './pages/CSBracketPage';
import { CSMatchResultsPage } from './pages/CSMatchResultsPage';
import { CSLeagueStandingsPage } from './pages/CSLeagueStandingsPage';
import { CSPlayoffBracketPage } from './pages/CSPlayoffBracketPage';
import { PublicRegistrationPage } from './pages/PublicRegistrationPage';
import { RulesPage } from './pages/RulesPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { RequestAdminPage } from './pages/RequestAdminPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminAuthPage } from './pages/AdminAuthPage';

// Creator & Public Viewer Pages
import { CreatorPanelPage } from './pages/CreatorPanelPage';
import { PublicViewerPage } from './pages/PublicViewerPage';
import { Button } from './components/ui/Button';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCreator } from './hooks/useCreator';

export interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isAdmin, loading, signIn } = useAuth();
  const { isCreatorUnlocked } = useCreator();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasAccess = isAdmin || isCreatorUnlocked;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 glass-card rounded-2xl border border-white/10 mt-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin or Creator Access Required</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          {user
            ? `Signed in as ${user.email}. This account does not have administrative privileges.`
            : 'You must sign in with an authorized administrator account or unlock the Creator Console to access this page.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={() => signIn()}>
            Sign in as Admin
          </Button>
          <Link to="/creator">
            <Button variant="secondary" className="border border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              Unlock Creator Console
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">Return to Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary isGlobal fallbackTitle="Application Rendering Notice">
      <GameProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                {/* Public routes — no login required */}
<Route path="/" element={<LeaderboardPage />} />
<Route path="/landing" element={<Navigate to="/" replace />} />
<Route path="/public" element={<Navigate to="/" replace />} />
                

                {/* Standalone Public Registration */}
                <Route
                  path="/register"
                  element={
                    <ErrorBoundary fallbackTitle="Registration Portal Unavailable">
                      <PublicRegistrationPage />
                    </ErrorBoundary>
                  }
                />

                {/* Standalone Administrator Sign In Page */}
                <Route
                  path="/login"
                  element={
                    <ErrorBoundary fallbackTitle="Admin Authentication Unavailable">
                      <AdminAuthPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/admin/login"
                  element={
                    <ErrorBoundary fallbackTitle="Admin Authentication Unavailable">
                      <AdminAuthPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/auth"
                  element={
                    <ErrorBoundary fallbackTitle="Admin Authentication Unavailable">
                      <AdminAuthPage />
                    </ErrorBoundary>
                  }
                />

                {/* Standalone Read-Only Public Viewer */}
                <Route
                  path="/public"
                  element={
                    <ErrorBoundary fallbackTitle="Public Viewer Unavailable">
                      <PublicViewerPage />
                    </ErrorBoundary>
                  }
                />

                {/* Secret Creator Master Console */}
                <Route
                  path="/creator"
                  element={
                    <ErrorBoundary fallbackTitle="Creator Console Unavailable">
                      <CreatorPanelPage />
                    </ErrorBoundary>
                  }
                />

                {/* Main App Layout (Leaderboard, Analytics, Admin Panels) */}
                <Route element={<Layout />}>
                  <Route
                    path="/leaderboard"
                    element={
                      <ErrorBoundary fallbackTitle="Leaderboard Unavailable">
                        <LeaderboardPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ErrorBoundary fallbackTitle="Analytics Unavailable">
                        <AnalyticsPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/rules"
                    element={
                      <ErrorBoundary fallbackTitle="Rules & Regulations Unavailable">
                        <RulesPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <ErrorBoundary fallbackTitle="FAQ & Support Unavailable">
                        <FAQPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <ErrorBoundary fallbackTitle="Contact & Inquiries Unavailable">
                        <ContactPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/request-admin"
                    element={
                      <ErrorBoundary fallbackTitle="Admin Access Request Unavailable">
                        <RequestAdminPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Clash Squad League Routes */}
                  <Route
                    path="/cs-standings"
                    element={
                      <ErrorBoundary fallbackTitle="Standings Unavailable">
                        <CSLeagueStandingsPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/cs-bracket"
                    element={
                      <ErrorBoundary fallbackTitle="Bracket Unavailable">
                        <CSBracketPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/cs-playoffs"
                    element={
                      <ErrorBoundary fallbackTitle="Playoffs Unavailable">
                        <CSPlayoffBracketPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/cs-groups"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Group Manager Unavailable">
                          <CSGroupManagerPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/cs-results"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Match Results Unavailable">
                          <CSMatchResultsPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />

                  {/* Battle Royale Admin Routes */}
                  <Route
                    path="/registration"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Registration Management Unavailable">
                          <RegistrationPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/approvals"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Approval Queue Unavailable">
                          <ApprovalQueuePage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/matches"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Match Results Unavailable">
                          <MatchResultsPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/activity"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Activity Log Unavailable">
                          <ActivityLogPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/data"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Data Backup Unavailable">
                          <AdminDataPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/registration"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Registration Management Unavailable">
                          <RegistrationPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/approvals"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Approval Queue Unavailable">
                          <ApprovalQueuePage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/matches"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Match Results Unavailable">
                          <MatchResultsPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/activity"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Activity Log Unavailable">
                          <ActivityLogPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Settings Unavailable">
                          <AdminSettingsPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <RequireAdmin>
                        <ErrorBoundary fallbackTitle="Settings Unavailable">
                          <AdminSettingsPage />
                        </ErrorBoundary>
                      </RequireAdmin>
                    }
                  />
                </Route>

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <ErrorBoundary fallbackTitle="Page Not Found">
                      <NotFoundPage />
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
