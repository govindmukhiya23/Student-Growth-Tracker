import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Boot: attempt silent refresh from httpOnly cookie
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const res = await api.post('/auth/refresh');
        if (!cancelled && res?.accessToken) {
          api.setAccessToken(res.accessToken);
          setUser(res.user);
        }
      } catch {
        // No active session — user starts logged out
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for forced logout events from the API client (e.g. 401 refresh failure)
  useEffect(() => {
    const handler = () => {
      setUser(null);
      api.clearAccessToken();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res?.accessToken) {
      api.setAccessToken(res.accessToken);
      setUser(res.user);
    }
    return res;
  }, []);

  const register = useCallback(async (formData) => {
    return await api.post('/auth/register', formData);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.user) {
        setUser(res.user);
      }
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear client state regardless of server response
    } finally {
      api.clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isApproved: user?.role === 'admin' || user?.status === 'approved' || user?.status === 'active',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
