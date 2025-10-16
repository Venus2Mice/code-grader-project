// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import * as api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      console.log('Fetching user profile...');
      api.getProfile()
        .then(response => {
          console.log('Profile loaded:', response.data);
          setUser(response.data);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to load profile:', err);
          // Token invalid or API error
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setError(err.message || 'Failed to load user profile');
        })
        .finally(() => setLoading(false));
    } else {
      console.log('No token found, skipping profile fetch');
      setLoading(false);
    }
  }, [token]);

  const loginAction = (data) => {
    console.log('Login action called with token');
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
  };

  const logoutAction = () => {
    console.log('Logout action called');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = { 
    token, 
    user, 
    loading, 
    error,
    loginAction, 
    logoutAction,
    isAuthenticated: !!token && !!user,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};