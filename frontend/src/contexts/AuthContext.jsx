import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('civiclens_token'));

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('civiclens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const adminLogin = async (email, password) => {
    const { data } = await authAPI.adminLogin({ email, password });
    localStorage.setItem('civiclens_token', data.token);
    setToken(data.token);
    // Ensure role is always present so isAdmin works immediately on next render
    const adminUser = { ...data.user, role: data.user.role || 'admin' };
    setUser(adminUser);
    return adminUser;
  };

  const register = async (fullName, email, password) => {
    const { data } = await authAPI.register({ fullName, email, password });
    localStorage.setItem('civiclens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('civiclens_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'authority' || user?.role === 'superadmin';
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAdmin, isSuperadmin, login, adminLogin, register, logout, updateUser, fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
