import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('teacher.test@example.com'); // Mặc định để test
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { loginAction } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login({ email, password });      
      loginAction(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link>.</p>
    </div>
  );
};

export default LoginPage;