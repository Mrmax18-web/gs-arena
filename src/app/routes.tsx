import React, { Suspense } from 'react';
import { Routes, Route, RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RoleGuard } from '../components/layout/RoleGuard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Implement React lazy loading with React.lazy
const GameSelectPage = React.lazy(() => import('../pages/GameSelectPage'));
const LeaderboardPage = React.lazy(() => import('../pages/LeaderboardPage'));
const AnalyticsPage = React.lazy(() => import('../pages/AnalyticsPage'));
const RegistrationPage = React.lazy(() => import('../pages/RegistrationPage'));
const RegistrationSuccess = React.lazy(() => import('../components/registration/RegistrationSuccess'));
const CSStandingsPage = React.lazy(() => import('../pages/CSStandingsPage'));
const RulesPage = React.lazy(() => import('../pages/RulesPage'));
const FAQPage = React.lazy(() => import('../pages/FAQPage'));
const ContactPage = React.lazy(() => import('../pages/ContactPage'));
const ViewerPage = React.lazy(() => import('../pages/ViewerPage'));
const AdminPage = React.lazy(() => import('../pages/AdminPage'));
const CreatorPage = React.lazy(() => import('../pages/CreatorPage'));
const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<LoadingSpinner label="Loading GS Arena..." />}>
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<GameSelectPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="registration" element={<RegistrationPage />} />
        <Route path="registration/success" element={<RegistrationSuccess />} />
        <Route path="cs-standings" element={<CSStandingsPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="admin"
          element={
            <RoleGuard allowedRoles={['admin', 'creator']}>
              <AdminPage />
            </RoleGuard>
          }
        />
        <Route
          path="creator"
          element={
            <RoleGuard allowedRoles={['creator', 'public', 'admin']}>
              <CreatorPage />
            </RoleGuard>
          }
        />
        <Route path="viewer" element={<ViewerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <GameSelectPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'registration', element: <RegistrationPage /> },
      { path: 'registration/success', element: <RegistrationSuccess /> },
      { path: 'cs-standings', element: <CSStandingsPage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['admin', 'creator']}>
            <AdminPage />
          </RoleGuard>
        ),
      },
      {
        path: 'creator',
        element: (
          <RoleGuard allowedRoles={['creator', 'public', 'admin']}>
            <CreatorPage />
          </RoleGuard>
        ),
      },
      { path: 'viewer', element: <ViewerPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
