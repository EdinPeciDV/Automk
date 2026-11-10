import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import CarList from '../components/CarList';
import CarForm from '../components/CarForm';

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate('/admin/'); }

  return (
    <div style={s.layout}>
      {/* sidebar */}
      <aside style={{ ...s.sidebar, transform: sidebarOpen ? 'translateX(0)' : undefined }}>
        <div style={s.sidebarLogo}>
          <span style={s.logoText}>AutoMk</span>
          <span style={s.logoSub}>Admin</span>
        </div>
        <nav style={s.nav}>
          <NavLink to="/admin/dashboard" style={navStyle} end>
            <span>🚗</span> Makinat
          </NavLink>
          <NavLink to="/admin/dashboard/new" style={navStyle}>
            <span>➕</span> Shto Makinë
          </NavLink>
        </nav>
        <div style={s.sidebarBottom}>
          <div style={s.adminInfo}>
            <div style={s.avatar}>{(admin?.name || 'A')[0]}</div>
            <div>
              <div style={{ fontSize: 13 }}>{admin?.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: '#9A9486' }}>{admin?.email}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Dil
          </button>
        </div>
      </aside>

      {/* overlay mobile */}
      {sidebarOpen && <div style={s.overlay} onClick={() => setSidebarOpen(false)} />}

      <div style={s.main}>
        {/* topbar */}
        <header style={s.topbar}>
          <button style={s.menuBtn} onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
            <span style={s.hamburger} />
            <span style={s.hamburger} />
            <span style={s.hamburger} />
          </button>
          <div />
        </header>

        <div style={s.content}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CarList />} />
            <Route path="dashboard/new" element={<CarForm />} />
            <Route path="dashboard/edit/:id" element={<CarForm />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Navigate({ to, replace }) {
  const navigate = useNavigate();
  React.useEffect(() => navigate(to, { replace }), []);
  return null;
}

const navStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 16px', borderRadius: 8,
  fontSize: 14, fontWeight: 400,
  color: isActive ? '#D4B97A' : '#9A9486',
  background: isActive ? 'rgba(212,185,122,.08)' : 'transparent',
  textDecoration: 'none', transition: 'all .15s'
});

const s = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220, background: '#14213D', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    borderRight: '1px solid rgba(212,185,122,.08)',
    position: 'fixed', inset: '0 auto 0 0', zIndex: 100,
    transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
    ['@media(max-width:768px)']: { transform: 'translateX(-100%)' }
  },
  sidebarLogo: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '28px 16px 20px', borderBottom: '1px solid rgba(212,185,122,.08)'
  },
  logoText: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: 24, color: '#D4B97A', letterSpacing: '.1em'
  },
  logoSub: { fontSize: 10, letterSpacing: '.15em', color: '#9A9486', textTransform: 'uppercase' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  sidebarBottom: { padding: '12px 12px 20px', borderTop: '1px solid rgba(212,185,122,.08)' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(212,185,122,.2)', color: '#D4B97A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond',serif", fontSize: 16, flexShrink: 0
  },
  main: { flex: 1, marginLeft: 220, minHeight: '100vh', background: '#0B1320' },
  topbar: {
    padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
    borderBottom: '1px solid rgba(212,185,122,.06)', justifyContent: 'space-between'
  },
  menuBtn: {
    background: 'none', border: 'none', padding: 8, gap: 5,
    display: 'none', flexDirection: 'column', cursor: 'pointer'
  },
  hamburger: { display: 'block', width: 20, height: 2, background: '#9A9486', borderRadius: 2 },
  content: { padding: 24, maxWidth: 1100 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99
  }
};
