'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'super_admin' | 'content_admin' | 'member' | 'pending';
  is_approved: boolean;
  avatar_url?: string;
  bio?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  totp_enabled?: boolean;
  sms_opt_in?: boolean;
}

interface LoginResult {
  requires_2fa?: boolean;
  temp_token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<LoginResult>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isContentAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('hr_token');
    const storedUser = localStorage.getItem('hr_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string): Promise<LoginResult> => {
    const res = await authApi.login({ email, password, turnstile_token: turnstileToken });
    const data = res.data;

    if (data.requires_2fa) {
      return { requires_2fa: true, temp_token: data.temp_token };
    }

    const { access_token, user: userData } = data;
    localStorage.setItem('hr_token', access_token);
    localStorage.setItem('hr_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return {};
  };

  const verify2FA = async (tempToken: string, code: string) => {
    const res = await authApi.verify2FA(tempToken, code);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('hr_token', access_token);
    localStorage.setItem('hr_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      const userData = res.data;
      localStorage.setItem('hr_user', JSON.stringify(userData));
      setUser(userData);
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'content_admin';
  const isContentAdmin = isAdmin;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, verify2FA, logout, refreshUser, isAdmin, isContentAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
