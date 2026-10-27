/**
 * API client with automatic token refresh handling.
 *
 * SECURITY:
 * - Access token stored in memory (module variable) — NOT localStorage.
 * - Refresh token is in an httpOnly SameSite=Strict cookie, sent automatically by the browser.
 * - On 401, we attempt one silent refresh then retry the original request.
 * - If refresh fails, we clear the in-memory token and redirect to /login.
 */

const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = API_HOST ? `${API_HOST}/api/v1` : '/api/v1';

let accessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

function setAccessToken(token) {
  accessToken = token;
}

function clearAccessToken() {
  accessToken = null;
}

function getAccessToken() {
  return accessToken;
}

// Queue callers that arrive during a refresh attempt
function subscribeToRefresh(callback) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

async function refreshTokenSilently() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // sends the httpOnly refresh token cookie
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  return data.accessToken;
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Silent token refresh on 401
  if (response.status === 401 && !options._retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshTokenSilently();
        setAccessToken(newToken);
        notifyRefreshSubscribers(newToken);
      } catch {
        clearAccessToken();
        notifyRefreshSubscribers(null);
        // Redirect to login (handled by AuthContext listener)
        window.dispatchEvent(new CustomEvent('auth:logout'));
        isRefreshing = false;
        throw new Error('Session expired. Please log in again.');
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for the ongoing refresh
      await new Promise(resolve => subscribeToRefresh(resolve));
    }

    // Retry the original request with the new token
    return apiFetch(path, { ...options, _retry: true });
  }

  // Parse response
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = response.status;
    err.errors = data.errors;
    throw err;
  }

  return data;
}

// Convenience wrappers
const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiFetch(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
  setAccessToken,
  clearAccessToken,
  getAccessToken,
};

export default api;
