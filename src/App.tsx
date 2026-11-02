import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { AppLayout } from './components/layout/AppLayout';
import { RoleGuard } from './components/layout/RoleGuard';
import { PageLoader } from './components/ui/PageLoader';

// Route Lazy Loading
const GameSelectPage = React.lazy(() =>
  import('./pages/GameSelectPage').then((m) => ({ default: m.GameSelectPage }))
);
const LeaderboardPage = React.lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const AnalyticsPage = React.lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const RegistrationPage = React.lazy(() =>
  import('./pages/RegistrationPage').then((m) => ({ default: m.RegistrationPage }))
);
const RegistrationSuccess = React.lazy(() =>
  import('./components/registration/RegistrationSuccess').then((m) => ({
    default: m.RegistrationSuccess,
  }))
);
const CSStandingsPage = React.lazy(() =>
  import('./pages/CSStandingsPage').then((m) => ({ default: m.CSStandingsPage }))
);
const RulesPage = React.lazy(() =>
  import('./pages/RulesPage').then((m) => ({ default: m.RulesPage }))
);
const FAQPage = React.lazy(() =>
  import('./pages/FAQPage').then((m) => ({ default: m.FAQPage }))
);
const ContactPage = React.lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const ViewerPage = React.lazy(() =>
  import('./pages/ViewerPage').then((m) => ({ default: m.ViewerPage }))
);
const AdminPage = React.lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const CreatorPage = React.lazy(() =>
  import('./pages/CreatorPage').then((m) => ({ default: m.CreatorPage }))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
