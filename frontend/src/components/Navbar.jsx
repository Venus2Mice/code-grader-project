// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logoutAction } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">Code Grader</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span>Welcome, {user.email} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};
export default Navbar;