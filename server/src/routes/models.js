const router = require('express').Router();
const { getDb } = require('../db');

/* GET /api/models/detect?q=Golf R */
router.get('/detect', async (req, res) => {
  try {
    const q  = (req.query.q || '').trim();
    if (!q) return res.json(null);
    const db  = await getDb();
    const row = await db.get(`
      SELECT model_pattern, brand_slug, brand_name FROM model_brand_map
      WHERE ? LIKE '%' || model_pattern || '%'
         OR model_pattern LIKE '%' || ? || '%'
      ORDER BY LENGTH(model_pattern) DESC
      LIMIT 1
    `, [q, q]);
    res.json(row ? { brandSlug: row.brand_slug, brandName: row.brand_name } : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* GET /api/models/suggestions?q=Go&brand=bmw */
router.get('/suggestions', async (req, res) => {
  try {
    const q    = (req.query.q || '').trim();
    const slug = req.query.brand || null;
    const db   = await getDb();
    const params = [];
    let sql = 'SELECT model_pattern,brand_slug,brand_name FROM model_brand_map WHERE 1=1';
    if (q)    { sql += ' AND model_pattern LIKE ?'; params.push('%' + q + '%'); }
    if (slug) { sql += ' AND brand_slug = ?';        params.push(slug); }
    sql += ' ORDER BY model_pattern ASC LIMIT 20';
    const rows = await db.all(sql, params);
    res.json(rows.map(r => ({ model: r.model_pattern, brandSlug: r.brand_slug, brandName: r.brand_name })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
