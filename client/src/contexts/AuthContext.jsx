import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    const nextToken = typeof accessToken === 'string' ? accessToken : (localStorage.getItem('authToken') || '');
    setToken(nextToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (nextToken) localStorage.setItem('authToken', nextToken);
    else localStorage.removeItem('authToken');
    const uid = userData.id || userData._id;
    if (uid) localStorage.setItem('userId', uid);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken('');
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
      if (e.key === 'authToken') setToken(e.newValue || '');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user && !!token, canAccessAdmin: !!(user && (user.role === 'admin' || user.canAccessAdmin)) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
