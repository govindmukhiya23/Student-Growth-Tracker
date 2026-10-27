import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

/**
 * AuthContext — Phase 0 placeholder.
 *
 * Phase 1 will complete:
 * - login(), logout(), register() implementations
 * - Loading user from GET /auth/me on app boot
 * - Listening to auth:logout event from the API client
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // null = not logged in
  const [loading, setLoading] = useState(true);  // true while checking session on boot

  // Boot: try to restore session from a valid httpOnly refresh token cookie
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        // Attempt silent refresh — if the cookie is still valid, we get a new access token
        const res = await api.post('/auth/refresh');
        if (!cancelled && res?.accessToken) {
          api.setAccessToken(res.accessToken);
          // Fetch current user
          const me = await api.get('/auth/me');
          if (!cancelled) setUser(me);
        }
      } catch {
        // No valid session — stay logged out
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // Listen for forced logout events from the API client
  useEffect(() => {
    const handler = () => {
      setUser(null);
      api.clearAccessToken();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear local state regardless
    } finally {
      api.clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
