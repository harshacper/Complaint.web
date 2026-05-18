'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user or admin details on start
  useEffect(() => {
    async function loadAuth() {
      const token = localStorage.getItem('complainsy_token');
      const adminToken = localStorage.getItem('complainsy_admin_token');

      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('complainsy_token');
          }
        } catch (err) {
          console.error('Failed to load user auth', err.message);
          localStorage.removeItem('complainsy_token');
        }
      }

      if (adminToken) {
        // Admin credentials stored as details or can fetch
        const savedAdmin = localStorage.getItem('complainsy_admin_details');
        if (savedAdmin) {
          try {
            setAdmin(JSON.parse(savedAdmin));
          } catch (e) {
            localStorage.removeItem('complainsy_admin_token');
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
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Signup failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Server error during signup'
      };
    }
  };

  // 2. User Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    }
  };

  // 3. User Google Login (Mock/Integration)
  const googleLogin = async (profile) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { profile });
      if (res.data.success) {
        localStorage.setItem('complainsy_token', res.data.token);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Google OAuth failed' };
    } catch (error) {
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

      const res = await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Update failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // 5. Admin Login
  const adminLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('complainsy_admin_token', res.data.token);
        localStorage.setItem('complainsy_admin_details', JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Admin login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid admin credentials'
      };
    }
  };

  // 6. User Logout
  const logout = () => {
    localStorage.removeItem('complainsy_token');
    setUser(null);
    router.push('/');
  };

  // 7. Admin Logout
  const adminLogout = () => {
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

export const useAuth = () => useContext(AuthContext);
