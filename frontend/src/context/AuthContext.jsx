import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        // Normalize role to be a string (like it is on login)
        setUser({
          ...data,
          role: data.role?.name || data.role
        });
      } catch (error) {
        // Only log out on 401 Unauthorized — not on network errors (e.g. server restart)
        if (error.response && error.response.status === 401) {
          setUser(null);
        }
        // For network errors, keep whatever state we had (don't force logout)
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.user?.status === 'Suspended') {
      window.location.href = '/account-suspended';
      return data;
    }
    setUser({
      ...data.user,
      role: data.user.role?.name || data.user.role
    });
    return data;
  };


  const logout = async () => {
    localStorage.removeItem('ewap_demo_mode');
    localStorage.removeItem('ewap_demo_role');
    await api.post('/auth/logout');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
