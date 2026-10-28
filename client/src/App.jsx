import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './core/AuthContext.jsx';
import Navbar from './core/Navbar.jsx';
import HomePage from './features/home/HomePage.jsx';
import clientFeatures from './features/index.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ element, roles, isPublic }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isPublic) {
    // If logged in and attempting to visit login/register, redirect accordingly
    if (isAuthenticated) {
      if (user.role === 'admin') return <Navigate to="/admin/students" replace />;
      if (user.status === 'pending') return <Navigate to="/pending" replace />;
      if (user.status === 'rejected') return <Navigate to="/rejected" replace />;
      return <Navigate to="/" replace />;
    }
    return element;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/30 animate-pulse">
            GT
          </div>
          <p className="text-xs font-semibold text-slate-400">Loading Student Growth Tracker…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Dynamic routes from features registry */}
          {clientFeatures.flatMap((feature) =>
            (feature.routes || []).map(({ path, element, roles, public: isPublic }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute
                    element={element}
                    roles={roles}
                    isPublic={isPublic}
                  />
                }
              />
            ))
          )}

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                <span className="text-4xl mb-3">🔍</span>
                <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
                <p className="mt-1 text-sm text-slate-400">The requested URL does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
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
