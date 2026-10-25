import { apiFetch } from './apiClient.js';

/**
 * authService.js — registration, login, and the client-side session
 * (JWT + user) that AuthContext wraps in React state. Talks to the real
 * backend (POST /api/auth/register, /api/auth/login) — there's no local
 * demo fallback for auth, since "who's logged in" has to be real for
 * purchase/sell/admin actions to mean anything.
 *
 * There is no "register as admin" — the backend always creates USER-role
 * accounts (see backend/prisma/schema.prisma's Role default). To test the
 * admin dashboard, promote an account's role to ADMIN directly in the
 * database after registering normally.
 */
const STORAGE_KEY = 'autoza.session';

/** @returns {{user: {id: string, email: string, role: 'USER'|'ADMIN'}, token: string} | null} */
export function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode, blocked) — the session just won't survive a refresh.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** @returns {Promise<{user: object, token: string}>} */
export function register(email, password) {
  return apiFetch('/auth/register', { method: 'POST', body: { email, password } });
}

/** @returns {Promise<{user: object, token: string}>} */
export function login(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}
