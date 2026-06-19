import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CurrentUser, login as loginApi, logoutOnServer, refreshAccessToken } from '../api/auth';
import { setAccessToken } from '../api/client';

interface AuthState {
  user: CurrentUser | null;
  isInitializing: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On mount, attempt to resume the session by exchanging the refresh cookie for a new access token.
  useEffect(() => {
    let cancelled = false;
    const remember = localStorage.getItem('auth.remember');
    const sessionAlive = sessionStorage.getItem('auth.alive');
    // "Don't remember me" + brand-new browser session → forget instead of resuming.
    if (remember === 'session' && sessionAlive !== '1') {
      (async () => {
        try { await logoutOnServer(); } catch { /* ignore */ }
        finally { if (!cancelled) setIsInitializing(false); }
      })();
      return () => { cancelled = true; };
    }
    sessionStorage.setItem('auth.alive', '1');
    (async () => {
      try {
        const { accessToken, user: refreshedUser } = await refreshAccessToken();
        if (!cancelled) { setAccessToken(accessToken); setUser(refreshedUser); }
      } catch { /* No valid refresh cookie — user must log in. */ }
      finally { if (!cancelled) setIsInitializing(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const { accessToken, user: loggedInUser } = await loginApi(email, password);
    localStorage.setItem('auth.remember', rememberMe ? 'persistent' : 'session');
    sessionStorage.setItem('auth.alive', '1');
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutOnServer();
    localStorage.removeItem('auth.remember');
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isInitializing, login, logout }), [user, isInitializing, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
