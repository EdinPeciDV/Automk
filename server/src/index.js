require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* static uploads */
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

/* API routes */
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/cars',   require('./routes/cars'));
app.use('/api/leads',  require('./routes/leads'));
app.use('/api/models', require('./routes/models'));

/* serve React admin build in production */
const adminDist = path.resolve(__dirname, '../../admin/dist');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get('/admin/*', (_req, res) =>
    res.sendFile(path.join(adminDist, 'index.html'))
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AutoMk API → http://localhost:${PORT}`));
