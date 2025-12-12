const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
ssl: {
    rejectUnauthorized: false // <--- BU SATIR ÇOK ÖNEMLİ (Port 5432 için)
  }

// Bağlantıyı test edelim
pool.connect()
  .then(() => console.log('✅ PostgreSQL Veritabanına Bağlanıldı (Klasik SQL Modu)'))
  .catch(err => console.error('❌ Bağlantı Hatası', err.stack));

module.exports = pool;