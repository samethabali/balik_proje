const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

// Bağlantıyı test edelim
pool.connect()
  .then((client) => {
    console.log('✅ PostgreSQL Veritabanına Bağlanıldı (Klasik SQL Modu)');
    client.release();
  })
  .catch(err => console.error('❌ Bağlantı Hatası', err.stack));

module.exports = pool;
