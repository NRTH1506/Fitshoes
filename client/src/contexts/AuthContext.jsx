import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    const uid = userData.id || userData._id;
    if (uid) localStorage.setItem('userId', uid);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
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
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
