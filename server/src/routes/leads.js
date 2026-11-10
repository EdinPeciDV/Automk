const router = require('express').Router();
const { getDb } = require('../db');

router.post('/', async (req, res) => {
  try {
    const d  = req.body || {};
    const db = await getDb();
    await db.run(`
      INSERT INTO leads
        (name,phone,email,car_id,preferred_car,date,brands,types,
         budget_min,budget_max,max_km,year_from,year_to,
         transmission,fuel,notes,whatsapp,source)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      d.name||null, d.phone||null, d.email||null,
      d.carId||null, d.preferredCar||null, d.date||null,
      d.brands ? JSON.stringify(d.brands) : null,
      d.types  ? JSON.stringify(d.types)  : null,
      d.budgetMin||null, d.budgetMax||null,
      d.maxKm||null, d.yearFrom||null, d.yearTo||null,
      d.transmission||null, d.fuel||null, d.notes||null,
      d.whatsapp ? 1 : 0, d.source||'website'
    ]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
