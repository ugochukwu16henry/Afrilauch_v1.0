import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, type User } from '../api';

const TOKEN_KEY = 'riseflow_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStoredToken() {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        const me = await api.auth.me(stored);
        setUser(me);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStoredToken();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.auth.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    if (token) api.auth.logout(token).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    const me = await api.auth.me(token);
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
