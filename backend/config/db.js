// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Veritabanı Bağlantı Ayarları (Daha Sağlam)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }, // Supabase için gerekli
  max: 20, // Havuzdaki maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // 30 saniye boşta kalan bağlantıyı kapat (Supabase kapatmadan biz kapatalım)
  connectionTimeoutMillis: 5000, // Bağlantı kurmak 2 saniyeden uzun sürerse hata ver
});

// Beklenmedik hataları yakala (Uygulamanın çökmesini engeller)
pool.on('error', (err, client) => {
  console.error('❌ Veritabanı havuzunda beklenmedik hata:', err);
  // Kritik hata değilse süreci öldürme, sadece logla.
});

module.exports = pool;