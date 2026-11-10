const multer = require('multer');
const path   = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'car-images';

// Store in memory buffer, then push to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

async function uploadToSupabase(file) {
  const ext      = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new Error('Supabase upload failed: ' + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

module.exports = { upload, uploadToSupabase };
