import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const BRANDS = [
  'volkswagen','bmw','mercedes-benz','audi','alfa-romeo',
  'lamborghini','ferrari','porsche','maserati','bentley',
  'rolls-royce','aston-martin','mclaren','land-rover','tesla'
];

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[-\s]/g, '');
}

function matches(car, q) {
  if (!q) return true;
  const n = normalize(q);
  return (
    normalize(car.brand).includes(n) ||
    normalize(car.model).includes(n) ||
    normalize(car.type).includes(n) ||
    normalize(car.colour).includes(n) ||
    normalize(car.fuel).includes(n) ||
    String(car.year).includes(q) ||
    String(car.price).includes(q) ||
    normalize(car.status).includes(n)
  );
}

export default function CarList() {
  const navigate = useNavigate();
  const [cars, setCars]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [brand, setBrand]       = useState('');
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, [brand]);

  async function load() {
    setLoading(true);
    try {
      const params = brand ? `?brand=${brand}` : '';
      const { data } = await api.get('/cars' + params);
      setCars(data);
    } catch { setError('Dështoi ngarkimi i makinave'); }
    finally  { setLoading(false); }
  }

  async function deleteCar(id) {
    if (!confirm('A je i sigurt që dëshiron ta fshish këtë makinë?')) return;
    setDeleting(id);
    try {
      await api.delete('/cars/' + id);
      setCars(prev => prev.filter(c => c.id !== id));
    } catch { alert('Fshirja dështoi'); }
    finally  { setDeleting(null); }
  }

  const filtered = useMemo(() => cars.filter(c => matches(c, search.trim())), [cars, search]);

  return (
    <div>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: '#D4B97A', flexShrink: 0 }}>
          Makinat{' '}
          <span style={{ color: '#9A9486', fontSize: 18 }}>
            ({filtered.length}{filtered.length !== cars.length ? `/${cars.length}` : ''})
          </span>
        </h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard/new')}>
          + Shto Makinë
        </button>
      </div>

      {/* search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={searchIcon}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kërko: Golf, Porsche, Audi A, SUV…"
            style={{ paddingLeft: 36 }}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} style={clearBtn} title="Clear">✕</button>
          )}
        </div>
        {/* brand filter */}
        <select value={brand} onChange={e => { setBrand(e.target.value); setSearch(''); }} style={{ width: 170 }}>
          <option value="">Të gjitha brendet</option>
          {BRANDS.map(b => (
            <option key={b} value={b}>
              {b.replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: 'auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50, color: '#9A9486' }}>
          {search
            ? <>Nuk u gjet asnjë makinë për <strong style={{ color: '#D4B97A' }}>"{search}"</strong>. <button className="btn btn-secondary btn-sm" style={{ marginLeft: 10 }} onClick={() => setSearch('')}>Pastro</button></>
            : <>Asnjë makinë ende. <button className="btn btn-primary btn-sm" style={{ marginLeft: 10 }} onClick={() => navigate('/admin/dashboard/new')}>Shto të parën</button></>
          }
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(car => (
            <CarRow
              key={car.id}
              car={car}
              search={search}
              onEdit={() => navigate(`/admin/dashboard/edit/${car.id}`)}
              onDelete={() => deleteCar(car.id)}
              deleting={deleting === car.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* highlight matching text */
function Highlight({ text, query }) {
  if (!query || !text) return text || null;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {String(text).slice(0, idx)}
      <mark style={{ background: 'rgba(212,185,122,.35)', color: '#F5F1E8', borderRadius: 2 }}>
        {String(text).slice(idx, idx + query.length)}
      </mark>
      {String(text).slice(idx + query.length)}
    </>
  );
}

function CarRow({ car, search, onEdit, onDelete, deleting }) {
  const img = car.images?.[0];
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
      {/* thumbnail */}
      <div style={{ width: 72, height: 52, borderRadius: 6, overflow: 'hidden', background: '#0B1320', flexShrink: 0 }}>
        {img
          ? <img src={img} alt={car.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9486', fontSize: 22 }}>🚗</div>}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>
          {car.year}{' '}
          <Highlight text={car.brand} query={search} />{' '}
          <Highlight text={car.model} query={search} />
        </div>
        <div className="text-sm text-stone" style={{ marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span><Highlight text={car.type} query={search} /></span>
          <span>·</span>
          <span>{car.km.toLocaleString()} km</span>
          <span>·</span>
          <span>€{car.price.toLocaleString()}</span>
          <span>·</span>
          <span><Highlight text={car.fuel} query={search} /></span>
          {car.colour && <><span>·</span><span><Highlight text={car.colour} query={search} /></span></>}
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className={`badge badge-${car.status}`}>
          <Highlight text={car.status} query={search} />
        </span>
        {car.featured && (
          <span className="badge" style={{ background: 'rgba(212,185,122,.15)', color: '#D4B97A' }}>⭐</span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>Ndrysho</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={deleting}>
          {deleting ? '…' : 'Fshi'}
        </button>
      </div>
    </div>
  );
}

const searchIcon = {
  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
  fontSize: 14, pointerEvents: 'none', zIndex: 1
};
const clearBtn = {
  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: '#9A9486', fontSize: 13,
  cursor: 'pointer', padding: '2px 4px', lineHeight: 1
};
