import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api, { TOKEN_KEY } from '../lib/api';
import { setCurrency } from '../lib/format';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const qc = useQueryClient();

  const apply = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setCurrency(data.company?.currency);
    setSession(data);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.get('/auth/me').then((r) => apply(r.data)).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, [apply]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    apply(data);
    return data;
  }, [apply]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    apply(data);
    return data;
  }, [apply]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
    qc.clear();
  }, [qc]);

  const refresh = useCallback(() => api.get('/auth/me').then((r) => apply(r.data)), [apply]);

  // Optimistic: hide the tour right away, then record it on the server
  const markOnboarded = useCallback(() => {
    setSession((s) => (s ? { ...s, user: { ...s.user, onboardedAt: s.user.onboardedAt || new Date().toISOString() } } : s));
    return api.post('/auth/onboarded').catch(() => {});
  }, []);

  const value = useMemo(() => ({
    user: session?.user,
    company: session?.company,
    permissions: session?.permissions || [],
    can: (modules) => {
      const list = Array.isArray(modules) ? modules : [modules];
      return !modules || list.some((m) => session?.permissions?.includes(m));
    },
    loading,
    login,
    register,
    logout,
    refresh,
    markOnboarded,
  }), [session, loading, login, register, logout, refresh, markOnboarded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
