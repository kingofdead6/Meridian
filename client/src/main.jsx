import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#16233A', color: '#F3F5F2', fontSize: 14, borderRadius: 10, padding: '10px 14px' },
              success: { iconTheme: { primary: '#4FA57A', secondary: '#16233A' } },
              error: { iconTheme: { primary: '#E07A62', secondary: '#16233A' }, duration: 5000 },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
