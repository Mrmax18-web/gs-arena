import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { AppProviders } from './providers';
import { PageLoader } from '../components/ui/PageLoader';

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
