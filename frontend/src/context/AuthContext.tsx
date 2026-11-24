import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginSuccess: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('reachinbox_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      setUser(data);
    } catch {
      localStorage.removeItem('reachinbox_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginSuccess = (token: string, userData: User) => {
    localStorage.setItem('reachinbox_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('reachinbox_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}