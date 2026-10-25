import { apiFetch } from './apiClient.js';

const STORAGE_KEY = 'autoza.session';

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
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function register(email, password) {
  return apiFetch('/auth/register', { method: 'POST', body: { email, password } });
}

export function login(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}
