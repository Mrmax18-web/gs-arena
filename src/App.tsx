import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import { AppProviders } from './app/providers';
import { PageLoader } from './components/ui/PageLoader';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
