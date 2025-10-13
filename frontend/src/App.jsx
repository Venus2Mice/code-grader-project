// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ClassDetailPage from './pages/ClassDetailPage';
import ProblemDetailPage from './pages/ProblemDetailPage';

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/class/:classId" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />
          <Route path="/problem/:problemId" element={<ProtectedRoute><ProblemDetailPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default App;