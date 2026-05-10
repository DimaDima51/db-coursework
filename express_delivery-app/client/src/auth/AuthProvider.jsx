import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, refreshToken as refreshRequest } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const saveAuthState = ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = async ({ staff_number, password }) => {
    setLoading(true);
    try {
      const response = await loginRequest({ staff_number, password });
      saveAuthState(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await refreshRequest({ refresh_token: refreshToken });
      saveAuthState(response.data);
      return response.data;
    } catch (err) {
      logout();
      return null;
    }
  };

  useEffect(() => {
    if (!user) {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        refresh();
      }
    }
  }, []);

  const hasRole = (...roles) => {
    return !!user && roles.includes(user.position_name);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refresh,
      loading,
      isAuthenticated: !!user,
      hasRole
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
