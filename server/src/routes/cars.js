const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();
const { getDb }       = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadToSupabase } = require('../middleware/upload');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const BUCKET = 'car-images';

async function deleteFromSupabase(urls) {
  const paths = urls.map(u => {
    try { return decodeURIComponent(new URL(u).pathname.split('/').pop()); }
    catch { return null; }
  }).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, brandSlug: row.brand_slug, brand: row.brand,
    model: row.model, type: row.type, year: row.year, km: row.km,
    price: row.price, currency: row.currency,
    fuel: row.fuel, transmission: row.transmission,
    hp: row.hp, acceleration: row.acceleration, topSpeed: row.top_speed,
    colour: row.colour, status: row.status, arrivalDate: row.arrival_date,
    featured: !!row.featured, description: row.description,
    images: JSON.parse(row.images || '[]'),
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

/* GET /cars */
router.get('/', async (req, res) => {
  try {
    const { brand, type, minPrice, maxPrice, maxKm, yearFrom, yearTo,
            fuel, transmission, sort, page, limit: lim } = req.query;

    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (brand && brand !== 'all') { sql += ' AND brand_slug = ?'; params.push(brand); }
    if (type  && type  !== 'all') { sql += ' AND type = ?';       params.push(type);  }
    if (minPrice) { sql += ' AND price >= ?'; params.push(Number(minPrice)); }
    if (maxPrice) { sql += ' AND price <= ?'; params.push(Number(maxPrice)); }
    if (maxKm)    { sql += ' AND km <= ?';    params.push(Number(maxKm));    }
    if (yearFrom) { sql += ' AND year >= ?';  params.push(Number(yearFrom)); }
    if (yearTo)   { sql += ' AND year <= ?';  params.push(Number(yearTo));   }
    if (fuel && fuel !== 'any')
      { sql += ' AND LOWER(fuel) = ?'; params.push(fuel.toLowerCase()); }
    if (transmission && transmission !== 'any')
      { sql += ' AND LOWER(transmission) = ?'; params.push(transmission.toLowerCase()); }

    const sortMap = {
      featured: 'featured DESC, created_at DESC',
      price_asc: 'price ASC', price_desc: 'price DESC',
      newest: 'year DESC', km_asc: 'km ASC'
    };
    sql += ' ORDER BY ' + (sortMap[sort] || sortMap.featured);

    const pageSize = Math.min(Number(lim) || 50, 100);
    const offset   = (Math.max(Number(page) || 1, 1) - 1) * pageSize;
    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

    const db = await getDb();
    const rows = await db.all(sql, params);
    res.json(rows.map(mapRow));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* GET /cars/:id */
router.get('/:id', async (req, res) => {
  try {
    const db  = await getDb();
    const row = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Car not found' });
    res.json(mapRow(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* POST /cars (admin) */
router.post('/', requireAuth, upload.array('images', 20), async (req, res) => {
  try {
    const d  = req.body;
    const db = await getDb();
    if (!d.brandSlug || !d.model || !d.type || !d.year || d.km===undefined || !d.price)
      return res.status(400).json({ error: 'Missing required fields' });

    const brand = await db.get('SELECT name FROM brands WHERE slug = ?', [d.brandSlug]);
    if (!brand) return res.status(400).json({ error: 'Unknown brand slug' });

    const id     = d.id || uuidv4();
    const images = await Promise.all((req.files || []).map(f => uploadToSupabase(f)));

    await db.run(`
      INSERT INTO cars
        (id,brand_slug,brand,model,type,year,km,price,currency,
         fuel,transmission,hp,acceleration,top_speed,colour,
         status,arrival_date,featured,description,images)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id, d.brandSlug, brand.name, d.model, d.type,
      Number(d.year), Number(d.km), Number(d.price), d.currency||'EUR',
      d.fuel, d.transmission,
      d.hp ? Number(d.hp) : null,
      d.acceleration||null, d.topSpeed||null, d.colour||null,
      d.status||'available', d.arrivalDate||null,
      (d.featured==='true'||d.featured===true) ? 1 : 0,
      d.description||null,
      JSON.stringify(images)
    ]);

    const created = await db.get('SELECT * FROM cars WHERE id = ?', [id]);
    res.status(201).json(mapRow(created));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* PUT /cars/:id (admin) */
router.put('/:id', requireAuth, upload.array('images', 20), async (req, res) => {
  try {
    const db  = await getDb();
    const existing = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Car not found' });

    const d          = req.body;
    const newImages  = await Promise.all((req.files || []).map(f => uploadToSupabase(f)));
    const keepImages = d.keepImages ? JSON.parse(d.keepImages) : JSON.parse(existing.images||'[]');
    const images     = [...keepImages, ...newImages];

    const brand = d.brandSlug
      ? await db.get('SELECT name FROM brands WHERE slug = ?', [d.brandSlug])
      : { name: existing.brand };

    await db.run(`
      UPDATE cars SET
        brand_slug=?,brand=?,model=?,type=?,year=?,km=?,price=?,
        currency=?,fuel=?,transmission=?,hp=?,acceleration=?,
        top_speed=?,colour=?,status=?,arrival_date=?,featured=?,
        description=?,images=?,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [
      d.brandSlug||existing.brand_slug, brand.name||existing.brand,
      d.model||existing.model, d.type||existing.type,
      Number(d.year||existing.year), Number(d.km||existing.km), Number(d.price||existing.price),
      d.currency||existing.currency, d.fuel||existing.fuel, d.transmission||existing.transmission,
      d.hp ? Number(d.hp) : existing.hp,
      d.acceleration||existing.acceleration, d.topSpeed||existing.top_speed,
      d.colour||existing.colour, d.status||existing.status,
      d.arrivalDate!==undefined ? d.arrivalDate : existing.arrival_date,
      (d.featured==='true'||d.featured===true) ? 1 : existing.featured,
      d.description!==undefined ? d.description : existing.description,
      JSON.stringify(images),
      req.params.id
    ]);

    const updated = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    res.json(mapRow(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* DELETE /cars/:id (admin) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db  = await getDb();
    const row = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Car not found' });

    try {
      const imgs = JSON.parse(row.images || '[]');
      await deleteFromSupabase(imgs);
    } catch {}

    await db.run('DELETE FROM cars WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
