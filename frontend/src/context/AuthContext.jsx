// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import * as api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getProfile()
        .then(response => setUser(response.data))
        .catch(() => { // Token invalid
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginAction = (data) => {
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
  };

  const logoutAction = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = { token, user, loginAction, logoutAction };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};