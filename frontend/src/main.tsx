import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import PreviewGate from '@/features/courses/PreviewGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PreviewWrapper>
            <App />
          </PreviewWrapper>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

function PreviewWrapper({ children }: { children: React.ReactNode }) {
  const previewPassword = (import.meta.env.VITE_PREVIEW_PASSWORD as string) || '';
  const [authorized, setAuthorized] = React.useState(() => {
    return sessionStorage.getItem('previewAuthorized') === 'true' || !previewPassword;
  });

  if (!authorized) {
    return (
      <PreviewGate
        onSuccess={() => {
          sessionStorage.setItem('previewAuthorized', 'true');
          setAuthorized(true);
        }}
      />
    );
  }
  return <>{children}</>;
}
