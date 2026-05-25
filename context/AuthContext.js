'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('avadh15_token');
    const u = localStorage.getItem('avadh15_user');
    if (t) setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('avadh15_token', data.token);
    localStorage.setItem('avadh15_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('avadh15_token');
    localStorage.removeItem('avadh15_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data.user);
      localStorage.setItem('avadh15_user', JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
