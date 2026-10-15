import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Silence noisy Firestore connection retry warnings in sandbox/iframe environments
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = args[0]?.toString() || '';
    if (
      msg.includes('@firebase/firestore') &&
      (msg.includes('WebChannel') || msg.includes('Could not reach') || msg.includes('offline'))
    ) {
      return; // Suppress harmless iframe transport renegotiation warnings
    }
    originalWarn(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary isGlobal fallbackTitle="Application Initialization Notice">
    <App />
  </ErrorBoundary>
);
