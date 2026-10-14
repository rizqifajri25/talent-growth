import React, { useState, useCallback, useMemo } from 'react';
import type { User, RegisterPayload, LoginPayload } from '../types/auth.types';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../api/client';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      tokenStore.setToken(data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      tokenStore.setToken(data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tokenStore.getToken()) {
        await authApi.logout();
      }
    } catch (err) {
      // Safely ignore server errors during logout; local session must always be cleared
      console.warn('Backend session revocation notice:', err instanceof Error ? err.message : err);
    } finally {
      tokenStore.clearToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStore.getToken()) {
      setUser(null);
      setToken(null);
      return;
    }

    setIsLoading(true);
    try {
      const refreshedUser = await authApi.getMe();
      setUser(refreshedUser);
    } catch {
      // If token is expired, revoked, or rejected by backend, clear session
      tokenStore.clearToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      register,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, register, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
