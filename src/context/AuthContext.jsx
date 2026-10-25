import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clearSession, getStoredSession, login as loginRequest, register as registerRequest, storeSession } from '../services/authService.js';

/**
 * Holds the signed-in session (JWT + user), backed by the real backend's
 * /api/auth endpoints. Lives above the router (see App.jsx), same reasoning
 * as CompareContext: a login has to survive moving between pages. Unlike
 * CompareContext this is NOT session-only — it's restored from
 * localStorage on load, so refreshing the page doesn't sign you out.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password);
    storeSession(result);
    setSession(result);
    return result;
  }, []);

  const register = useCallback(async (email, password) => {
    const result = await registerRequest(email, password);
    storeSession(result);
    setSession(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      isAdmin: session?.user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
