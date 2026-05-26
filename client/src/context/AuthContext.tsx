'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { logger } from '../utils/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface AuthContextType {
  user: any;
  admin: any;
  loading: boolean;
  register: (formData: any) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  googleLogin: (profile: any) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; message: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  adminLogout: () => void;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user or admin details on start
  useEffect(() => {
    async function loadAuth() {
      const token = localStorage.getItem('complainsy_token');
      const adminToken = localStorage.getItem('complainsy_admin_token');

      logger.addLog('INFO', `Client startup initializing. API URL: ${API_URL}`, {
        hasToken: !!token,
        hasAdminToken: !!adminToken
      });

      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setUser(res.data.user);
            logger.addLog('SUCCESS', `User session restored for: ${res.data.user.email}`);
          } else {
            localStorage.removeItem('complainsy_token');
            logger.addLog('ERROR', 'Token validation failed, session cleared');
          }
        } catch (err: any) {
          console.error('Failed to load user auth', err.message);
          localStorage.removeItem('complainsy_token');
          logger.addLog('ERROR', `Session restore error: ${err.message}`, {
            status: err.response?.status,
            data: err.response?.data
          });
        }
      }

      if (adminToken) {
        const savedAdmin = localStorage.getItem('complainsy_admin_details');
        if (savedAdmin) {
          try {
            setAdmin(JSON.parse(savedAdmin));
            logger.addLog('SUCCESS', 'Admin session restored from cache');
          } catch (e: any) {
            localStorage.removeItem('complainsy_admin_token');
            logger.addLog('ERROR', `Admin cache corrupt: ${e.message}`);
          }
        }
      }

      setLoading(false);
    }

    loadAuth();
  }, []);

  // 1. User Register
  const register = async (formData) => {
    try {
      logger.addLog('INFO', `Signup requested to: ${API_URL}/auth/register`, {
        email: formData.email,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        age: formData.age
      });

      const res = await axios.post(`${API_URL}/auth/register`, formData);
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        logger.addLog('SUCCESS', `User registered successfully: ${formData.email}`, res.data);
        return { success: true, message: res.data.message };
      }
      logger.addLog('ERROR', `Signup failed: ${res.data.message || 'No details provided'}`, res.data);
      return { success: false, message: res.data.message || 'Signup failed' };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Server error during signup';
      logger.addLog('ERROR', `Signup server error: ${errMsg}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        message: errMsg
      };
    }
  };

  // 2. User Login
  const login = async (email, password) => {
    try {
      logger.addLog('INFO', `Login requested to: ${API_URL}/auth/login`, { email });
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        logger.addLog('SUCCESS', `User logged in successfully: ${email}`, res.data);
        return { success: true, message: res.data.message };
      }
      logger.addLog('ERROR', `Login rejected: ${res.data.message || 'Incorrect details'}`, res.data);
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Invalid email or password';
      logger.addLog('ERROR', `Login server error: ${errMsg}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        message: errMsg
      };
    }
  };

  // 3. User Google Login (Mock/Integration)
  const googleLogin = async (profile) => {
    try {
      logger.addLog('INFO', `Google OAuth login requested for: ${profile.email}`);
      const res = await axios.post(`${API_URL}/auth/google`, { profile });
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        logger.addLog('SUCCESS', `Google login successful for: ${profile.email}`);
        return { success: true, message: res.data.message };
      }
      logger.addLog('ERROR', 'Google login rejected by server');
      return { success: false, message: res.data.message || 'Google OAuth failed' };
    } catch (error: any) {
      logger.addLog('ERROR', 'Google OAuth network error', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Google Auth Connection failed'
      };
    }
  };

  // 4. Update Profile
  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('complainsy_token');
      if (!token) return { success: false, message: 'Not logged in' };

      logger.addLog('INFO', 'Updating user profile details', profileData);
      const res = await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setUser(res.data.user);
        logger.addLog('SUCCESS', 'User profile updated successfully', res.data);
        return { success: true, message: res.data.message };
      }
      logger.addLog('ERROR', 'Profile update rejected');
      return { success: false, message: res.data.message || 'Update failed' };
    } catch (error: any) {
      logger.addLog('ERROR', 'Profile update error', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // 5. Admin Login
  const adminLogin = async (email, password) => {
    try {
      logger.addLog('INFO', `Admin login requested to: ${API_URL}/admin/login`, { email });
      const res = await axios.post(`${API_URL}/admin/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('complainsy_admin_token', res.data.token);
        localStorage.setItem('complainsy_admin_details', JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        logger.addLog('SUCCESS', `Admin logged in successfully: ${email}`, res.data);
        return { success: true, message: res.data.message };
      }
      logger.addLog('ERROR', 'Admin login rejected');
      return { success: false, message: res.data.message || 'Admin login failed' };
    } catch (error: any) {
      logger.addLog('ERROR', 'Admin login error', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid admin credentials'
      };
    }
  };

  // 6. User Logout
  const logout = () => {
    logger.addLog('INFO', 'User logged out, session cleared');
    localStorage.removeItem('complainsy_token');
    setUser(null);
    router.push('/');
  };

  // 7. Admin Logout
  const adminLogout = () => {
    logger.addLog('INFO', 'Admin logged out, admin session cleared');
    localStorage.removeItem('complainsy_admin_token');
    localStorage.removeItem('complainsy_admin_details');
    setAdmin(null);
    router.push('/admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        loading,
        register,
        login,
        googleLogin,
        updateProfile,
        adminLogin,
        logout,
        adminLogout,
        isUserAuthenticated: !!user,
        isAdminAuthenticated: !!admin,
        apiUrl: API_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
