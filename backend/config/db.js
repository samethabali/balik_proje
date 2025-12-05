const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Bağlantıyı test edelim
pool.connect()
  .then(() => console.log('✅ PostgreSQL Veritabanına Bağlanıldı (Klasik SQL Modu)'))
  .catch(err => console.error('❌ Bağlantı Hatası', err.stack));

module.exports = pool;