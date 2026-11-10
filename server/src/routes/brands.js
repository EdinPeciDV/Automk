const router = require('express').Router();
const { getDb } = require('../db');

router.get('/', async (_req, res) => {
  try {
    const db = await getDb();
    const brands = await db.all('SELECT * FROM brands ORDER BY name');
    const result = await Promise.all(brands.map(async b => {
      const r = await db.get('SELECT COUNT(*) as n FROM cars WHERE brand_slug = ?', [b.slug]);
      return { ...b, carCount: r ? r.n : 0 };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const db = await getDb();
    const b  = await db.get('SELECT * FROM brands WHERE slug = ?', [req.params.slug]);
    if (!b) return res.status(404).json({ error: 'Brand not found' });
    const r  = await db.get('SELECT COUNT(*) as n FROM cars WHERE brand_slug = ?', [b.slug]);
    res.json({ ...b, carCount: r ? r.n : 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
