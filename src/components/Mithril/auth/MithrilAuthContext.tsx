"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { MithrilUserPublic } from '@/components/Mithril/services/firestore/types';

interface MithrilAuthContextProps {
  user: MithrilUserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const MithrilAuthContext = createContext<MithrilAuthContextProps | undefined>(undefined);

interface MithrilAuthProviderProps {
  children: ReactNode;
}

export const MithrilAuthProvider: React.FC<MithrilAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MithrilUserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/mithril/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/mithril/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/mithril/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === 'admin';

  return (
    <MithrilAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </MithrilAuthContext.Provider>
  );
};

export const useMithrilAuth = () => {
  const context = useContext(MithrilAuthContext);
  if (!context) {
    throw new Error('useMithrilAuth must be used within a MithrilAuthProvider');
  }
  return context;
};