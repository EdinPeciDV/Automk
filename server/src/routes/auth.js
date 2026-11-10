const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDb } = require('../db');

router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const db   = await getDb();
    const user = await db.get('SELECT * FROM admin_users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    res.json({ token, expiresIn, admin: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ admin: { id: p.id, email: p.email, name: p.name } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
