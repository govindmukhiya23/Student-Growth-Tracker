import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './core/AuthContext.jsx';
import clientFeatures from './features/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Build routes from the feature registry
function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes registered by each feature */}
      {clientFeatures.flatMap(feature =>
        (feature.routes || []).map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))
      )}
      {/* Fallback — Phase 1 will replace this with a proper landing page */}
      <Route
        path="*"
        element={
          <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Student Growth Tracker</h1>
            <p className="text-gray-500">Phase 0 — server and client are running ✅</p>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
