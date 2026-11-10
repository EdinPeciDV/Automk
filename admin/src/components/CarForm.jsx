import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ImageUpload from './ImageUpload';

const BRANDS = [
  { slug: 'volkswagen',  name: 'Volkswagen'   },
  { slug: 'bmw',         name: 'BMW'          },
  { slug: 'mercedes-benz',name:'Mercedes-Benz'},
  { slug: 'audi',        name: 'Audi'         },
  { slug: 'alfa-romeo',  name: 'Alfa Romeo'   },
  { slug: 'lamborghini', name: 'Lamborghini'  },
  { slug: 'ferrari',     name: 'Ferrari'      },
  { slug: 'porsche',     name: 'Porsche'      },
  { slug: 'maserati',    name: 'Maserati'     },
  { slug: 'bentley',     name: 'Bentley'      },
  { slug: 'rolls-royce', name: 'Rolls-Royce'  },
  { slug: 'aston-martin',name: 'Aston Martin' },
  { slug: 'mclaren',     name: 'McLaren'      },
  { slug: 'land-rover',  name: 'Land Rover'   },
  { slug: 'tesla',       name: 'Tesla'        },
];

const TYPES        = ['sports','gt','suv','sedan','convertible','electric','luxury'];
const FUELS        = ['Petrol','Diesel','Hybrid','Electric'];
const TRANSMISSIONS= ['Automatic','Manual'];
const STATUSES     = ['available','reserved','arriving'];

const EMPTY = {
  brandSlug:'', model:'', type:'', year: new Date().getFullYear(),
  km:'', price:'', currency:'EUR', fuel:'Petrol', transmission:'Automatic',
  hp:'', acceleration:'', topSpeed:'', colour:'',
  status:'available', arrivalDate:'', featured:false, description:''
};

export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm]       = useState(EMPTY);
  const [images, setImages]   = useState([]);      /* new File objects */
  const [keepImgs, setKeepImgs] = useState([]);    /* existing URLs to keep */
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  /* model autocomplete */
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const sugRef = useRef(null);
  const detectTimeout = useRef(null);

  /* load car for edit */
  useEffect(() => {
    if (!isEdit) return;
    api.get('/cars/' + id).then(r => {
      const c = r.data;
      setForm({
        brandSlug: c.brandSlug || '', model: c.model || '', type: c.type || '',
        year: c.year, km: c.km, price: c.price, currency: c.currency || 'EUR',
        fuel: c.fuel, transmission: c.transmission,
        hp: c.hp || '', acceleration: c.acceleration || '',
        topSpeed: c.topSpeed || '', colour: c.colour || '',
        status: c.status, arrivalDate: c.arrivalDate || '',
        featured: c.featured || false, description: c.description || ''
      });
      setKeepImgs(c.images || []);
      setLoading(false);
    }).catch(() => { setError('Dështoi ngarkimi i makinës'); setLoading(false); });
  }, [id]);

  /* close suggestions on outside click */
  useEffect(() => {
    function handler(e) {
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  /* model change → detect brand automatically */
  function handleModelChange(val) {
    set('model', val);
    clearTimeout(detectTimeout.current);
    if (val.length < 2) { setSuggestions([]); setShowSug(false); return; }

    detectTimeout.current = setTimeout(async () => {
      try {
        /* suggestions */
        const { data: sugs } = await api.get('/models/suggestions?q=' + encodeURIComponent(val));
        setSuggestions(sugs);
        setShowSug(sugs.length > 0);

        /* detect brand if not manually set */
        const { data: detected } = await api.get('/models/detect?q=' + encodeURIComponent(val));
        if (detected) {
          setForm(prev => ({
            ...prev,
            model: val,
            brandSlug: prev.brandSlug || detected.brandSlug
          }));
        }
      } catch {}
    }, 300);
  }

  function pickSuggestion(sug) {
    setForm(prev => ({ ...prev, model: sug.model, brandSlug: sug.brandSlug }));
    setSuggestions([]);
    setShowSug(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('keepImages', JSON.stringify(keepImgs));
      images.forEach(f => fd.append('images', f));

      if (isEdit) {
        await api.put('/cars/' + id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/cars', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }} /></div>;

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 28 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/dashboard')}>← Kthehu</button>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: '#D4B97A' }}>
          {isEdit ? 'Ndrysho Makinën' : 'Shto Makinë të Re'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Photos ── */}
        <div className="card">
          <h2 style={sectionTitle}>Fotot</h2>
          <ImageUpload
            existing={keepImgs}
            onExistingChange={setKeepImgs}
            onNewFiles={setImages}
          />
        </div>

        {/* ── Identity ── */}
        <div className="card">
          <h2 style={sectionTitle}>Identiteti i Makinës</h2>
          <div className="grid-2 mt-2">

            {/* Model with autocomplete + brand detection */}
            <div ref={sugRef} style={{ position: 'relative' }}>
              <label>Modeli *</label>
              <input
                value={form.model}
                onChange={e => handleModelChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                placeholder="e.g. M3 Competition"
                required
              />
              {showSug && suggestions.length > 0 && (
                <ul style={sugStyle}>
                  {suggestions.map(s => (
                    <li key={s.model + s.brandSlug} style={sugItem} onMouseDown={() => pickSuggestion(s)}>
                      <span>{s.model}</span>
                      <span style={{ color: '#9A9486', fontSize: 11 }}>{s.brandName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Brand — auto-filled from model, or manual override */}
            <div>
              <label>
                Brendi *
                {form.brandSlug && <span style={{ color: '#D4B97A', marginLeft: 8, fontSize: 11 }}>✓ u gjet automatikisht</span>}
              </label>
              <select value={form.brandSlug} onChange={e => set('brandSlug', e.target.value)} required>
                <option value="">— Zgjidh brendin —</option>
                {BRANDS.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label>Tipi *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} required>
                <option value="">— Zgjidh tipin —</option>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label>Viti *</label>
              <input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max={new Date().getFullYear()+2} required />
            </div>
          </div>
        </div>

        {/* ── Specs ── */}
        <div className="card">
          <h2 style={sectionTitle}>Specifikimet</h2>
          <div className="grid-3 mt-2">
            <div>
              <label>Kilometrazha (km) *</label>
              <input type="number" value={form.km} onChange={e => set('km', e.target.value)} min="0" required />
            </div>
            <div>
              <label>Çmimi *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} min="0" required />
            </div>
            <div>
              <label>Valuta</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option>
              </select>
            </div>
            <div>
              <label>Karburanti</label>
              <select value={form.fuel} onChange={e => set('fuel', e.target.value)}>
                {FUELS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label>Transmisioni</label>
              <select value={form.transmission} onChange={e => set('transmission', e.target.value)}>
                {TRANSMISSIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Kuajfuqi (hp)</label>
              <input type="number" value={form.hp} onChange={e => set('hp', e.target.value)} min="0" />
            </div>
            <div>
              <label>0–100 km/h (p.sh. 3.9s)</label>
              <input value={form.acceleration} onChange={e => set('acceleration', e.target.value)} placeholder="3.9s" />
            </div>
            <div>
              <label>Shpejtësia maksimale (p.sh. 290 km/h)</label>
              <input value={form.topSpeed} onChange={e => set('topSpeed', e.target.value)} placeholder="290 km/h" />
            </div>
            <div>
              <label>Ngjyra</label>
              <input value={form.colour} onChange={e => set('colour', e.target.value)} placeholder="Dravit Grey" />
            </div>
          </div>
        </div>

        {/* ── Status ── */}
        <div className="card">
          <h2 style={sectionTitle}>Statusi &amp; Dukshmëria</h2>
          <div className="grid-3 mt-2">
            <div>
              <label>Statusi</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            {form.status === 'arriving' && (
              <div>
                <label>Data e mbërritjes (YYYY-MM)</label>
                <input value={form.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} placeholder="2025-03" />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 13, color: '#F5F1E8' }}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width: 'auto' }} />
                Featuro këtë makinë (shfaqet e para)
              </label>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="card">
          <h2 style={sectionTitle}>Përshkrimi</h2>
          <div className="mt-2">
            <textarea
              rows={5}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Përshkrim opsional që shfaqet vizitorëve…"
            />
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140, justifyContent: 'center' }}>
            {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Duke ruajtur…</> : isEdit ? '✓ Ruaj Ndryshimet' : '✓ Posto Makinën'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            Anulo
          </button>
        </div>

      </form>
    </div>
  );
}

const sectionTitle = { fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#D4B97A' };

const sugStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
  background: '#14213D', border: '1px solid rgba(212,185,122,.2)', borderRadius: 8,
  marginTop: 4, maxHeight: 220, overflowY: 'auto', listStyle: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,.4)'
};
const sugItem = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 14px', cursor: 'pointer', fontSize: 13,
  borderBottom: '1px solid rgba(212,185,122,.06)',
  transition: 'background .1s'
};
