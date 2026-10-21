import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { AppProviders } from './providers';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner label="Loading GS Arena..." />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
