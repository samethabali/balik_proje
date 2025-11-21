// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({ message: 'Lake backend çalışıyor 🚤' });
});

// Veritabanı bağlantı testi
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({
      ok: true,
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('DB test hatası:', err);
    res.status(500).json({
      ok: false,
      error: 'Veritabanına bağlanılamadı',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
