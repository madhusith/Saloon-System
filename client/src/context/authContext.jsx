import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from LocalStorage and verify with /auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Fetch latest user data from server to verify token
          const res = await api.get('/auth/me');
          if (res.data && res.data.success) {
            const freshUser = {
              id: res.data.data.user.id,
              fullName: res.data.data.user.full_name,
              email: res.data.data.user.email,
              phone: res.data.data.user.phone,
              role: res.data.data.user.role,
              mustChangePassword: !!res.data.data.user.must_change_password
            };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          // Token is invalid or expired
          handleLogoutLocal();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for silent token refresh failures (session expired)
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth_session_expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const handleLogoutLocal = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  /**
   * Log in user
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { accessToken, refreshToken, user: loggedUser } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please verify credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Backend logout failed:', error);
    } finally {
      handleLogoutLocal();
      setLoading(false);
    }
  };

  /**
   * Register customer
   */
  const register = async (fullName, email, phone, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
        confirmPassword
      });
      return {
        success: true,
        message: res.data?.message || 'Registration successful.'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  /**
   * Request password reset link
   */
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data?.message || 'If that email exists, a password reset link has been dispatched.'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed.'
      };
    }
  };

  /**
   * Reset password using token
   */
  const resetPassword = async (token, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        email,
        password,
        confirmPassword
      });
      return {
        success: true,
        message: res.data?.message || 'Password reset successful.'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed.'
      };
    }
  };

  /**
   * Change user password (authenticated)
   */
  const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
    try {
      const res = await api.patch('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmNewPassword
      });
      // Changing password invalidates active sessions, so log out locally
      handleLogoutLocal();
      return {
        success: true,
        message: res.data?.message || 'Password changed successfully. Please log in again.'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        changePassword,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
