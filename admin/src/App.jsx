import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('automk_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setAdmin(r.data.admin))
      .catch(() => localStorage.removeItem('automk_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, adminData, remember) {
    if (remember) localStorage.setItem('automk_token', token);
    else sessionStorage.setItem('automk_token', token); /* still stored for session */
    localStorage.setItem('automk_token', token);
    setAdmin(adminData);
  }

  function logout() {
    localStorage.removeItem('automk_token');
    setAdmin(null);
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );

  return <AuthCtx.Provider value={{ admin, login, logout }}>{children}</AuthCtx.Provider>;
}

function Guard({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/admin/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/" element={<Login />} />
          <Route path="/admin/*" element={<Guard><Dashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/admin/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
