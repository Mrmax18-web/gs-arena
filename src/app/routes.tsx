import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RoleGuard } from '../components/layout/RoleGuard';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import { Skeleton } from '../components/ui/Skeleton';

// Lazy-load route pages with React.lazy + Suspense
const GameSelectPage = lazy(() =>
  import('../pages/GameSelectPage').then((m) => ({ default: m.GameSelectPage }))
);
const LeaderboardPage = lazy(() =>
  import('../pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const AnalyticsPage = lazy(() =>
  import('../pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const RegistrationPage = lazy(() =>
  import('../pages/RegistrationPage').then((m) => ({ default: m.RegistrationPage }))
);
const RegistrationSuccess = lazy(() =>
  import('../components/registration/RegistrationSuccess').then((m) => ({
    default: m.RegistrationSuccess,
  }))
);
const CSStandingsPage = lazy(() =>
  import('../pages/CSStandingsPage').then((m) => ({ default: m.CSStandingsPage }))
);
const RulesPage = lazy(() =>
  import('../pages/RulesPage').then((m) => ({ default: m.RulesPage }))
);
const FAQPage = lazy(() =>
  import('../pages/FAQPage').then((m) => ({ default: m.FAQPage }))
);
const ContactPage = lazy(() =>
  import('../pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const ViewerPage = lazy(() =>
  import('../pages/ViewerPage').then((m) => ({ default: m.ViewerPage }))
);
const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const CreatorPage = lazy(() =>
  import('../pages/CreatorPage').then((m) => ({ default: m.CreatorPage }))
);
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const PageLoader = () => (
  <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-4">
    <Skeleton height={60} className="w-1/3" />
    <Skeleton height={200} className="w-full" />
    <Skeleton height={300} className="w-full" />
  </div>
);

const withSuspenseAndBoundary = (Component: React.ComponentType, title?: string) => (
  <ErrorBoundary fallbackTitle={title}>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: withSuspenseAndBoundary(GameSelectPage, 'Game Select'),
      },
      {
        path: 'leaderboard',
        element: withSuspenseAndBoundary(LeaderboardPage, 'Leaderboard'),
      },
      {
        path: 'analytics',
        element: withSuspenseAndBoundary(AnalyticsPage, 'Analytics'),
      },
      {
        path: 'registration',
        element: withSuspenseAndBoundary(RegistrationPage, 'Squad Registration'),
      },
      {
        path: 'registration/success',
        element: withSuspenseAndBoundary(RegistrationSuccess, 'Registration Received'),
      },
      {
        path: 'cs-standings',
        element: withSuspenseAndBoundary(CSStandingsPage, 'Clash Squad Standings'),
      },
      {
        path: 'rules',
        element: withSuspenseAndBoundary(RulesPage, 'Tournament Rules'),
      },
      {
        path: 'faq',
        element: withSuspenseAndBoundary(FAQPage, 'Frequently Asked Questions'),
      },
      {
        path: 'contact',
        element: withSuspenseAndBoundary(ContactPage, 'Contact Operations'),
      },
      {
        path: 'login',
        element: withSuspenseAndBoundary(LoginPage, 'Authentication Portal'),
      },
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['admin', 'creator']}>
            {withSuspenseAndBoundary(AdminPage, 'Admin Management Console')}
          </RoleGuard>
        ),
      },
      {
        path: 'creator',
        element: (
          <RoleGuard allowedRoles={['creator', 'public', 'admin']}>
            {/* The page itself checks creator claim and displays the Creator Unlock form if not claimed */}
            {withSuspenseAndBoundary(CreatorPage, 'Creator Superadmin Console')}
          </RoleGuard>
        ),
      },
      {
        path: 'viewer',
        element: withSuspenseAndBoundary(ViewerPage, 'OBS Broadcast Overlay'),
      },
      {
        path: '*',
        element: withSuspenseAndBoundary(NotFoundPage, 'Page Not Found'),
      },
    ],
  },
];
