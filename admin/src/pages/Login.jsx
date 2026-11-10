import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';

export default function Login() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (admin) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe: remember });
      login(data.token, data.admin, remember);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.box}>
        {/* logo */}
        <div style={styles.logo}>
          <span style={styles.logoText}>AutoMk</span>
          <span style={styles.logoSub}>Admin Panel</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} autoComplete="on">
          <div>
            <label htmlFor="email">Adresa email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@automk.com"
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label htmlFor="password">Fjalëkalimi</label>
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={styles.eyeBtn}
              tabIndex={-1}
              aria-label={showPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <label style={styles.rememberLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: 'auto', marginRight: 8 }}
            />
            Mbaj mend për 30 ditë
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Hyr'}
          </button>
        </form>

        <p style={styles.hint}>AutoMk — Salloni Luksoz i Makinave</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24,
    background: 'radial-gradient(ellipse at 50% 0%, #1D2B4A 0%, #0B1320 60%)'
  },
  box: {
    width: '100%', maxWidth: 400, padding: 40,
    background: '#14213D', borderRadius: 16,
    border: '1px solid rgba(212,185,122,.15)',
    boxShadow: '0 24px 64px rgba(0,0,0,.5)'
  },
  logo: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginBottom: 36, gap: 4
  },
  logoText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32, fontWeight: 500, letterSpacing: '.1em',
    color: '#D4B97A'
  },
  logoSub: {
    fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase',
    color: '#9A9486'
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  rememberLabel: {
    display: 'flex', alignItems: 'center',
    fontSize: 13, color: '#9A9486', textTransform: 'none', marginBottom: 0
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)',
    marginTop: 11,
    background: 'none', border: 'none', fontSize: 16,
    color: '#9A9486', padding: 4, lineHeight: 1
  },
  hint: {
    marginTop: 28, textAlign: 'center', fontSize: 11,
    color: 'rgba(154,148,134,.4)', letterSpacing: '.06em'
  }
};
