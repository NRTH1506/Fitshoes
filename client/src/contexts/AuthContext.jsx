import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [isAuthReady, setIsAuthReady] = useState(() => !localStorage.getItem('authToken'));

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    const nextToken = typeof accessToken === 'string' ? accessToken : (localStorage.getItem('authToken') || '');
    setToken(nextToken);
    setIsAuthReady(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (nextToken) localStorage.setItem('authToken', nextToken);
    else localStorage.removeItem('authToken');
    const uid = userData.id || userData._id;
    if (uid) localStorage.setItem('userId', uid);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken('');
    setIsAuthReady(true);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'currentUser') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch { setUser(null); }
      }
      if (e.key === 'authToken') {
        setToken(e.newValue || '');
        setIsAuthReady(!e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsAuthReady(true);
      return;
    }

    let active = true;
    setIsAuthReady(false);

    getMe()
      .then((res) => {
        if (!active || !res.data?.user) return;
        setUser(res.data.user);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        const uid = res.data.user.id || res.data.user._id;
        if (uid) localStorage.setItem('userId', uid);
        setIsAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setToken('');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        setIsAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user && !!token, isAuthReady, canAccessAdmin: !!(user && (user.role === 'admin' || user.canAccessAdmin)) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
