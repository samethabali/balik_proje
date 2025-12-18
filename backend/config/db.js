// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// DATABASE_URL kontrolü
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl === 'your_database_url_here') {
  console.error('❌ HATA: DATABASE_URL .env dosyasında tanımlı değil veya geçersiz!');
  console.error('💡 Lütfen backend/.env dosyasını düzenleyin ve DATABASE_URL değerini güncelleyin.');
  console.error('💡 Supabase için: Project Settings → Database → Connection String → Node.js');
  console.error('💡 Örnek format: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres');
  process.exit(1);
}

// Veritabanı Bağlantı Ayarları (Daha Sağlam)
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }, // Supabase için gerekli
  max: 10, // Havuzdaki maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // 30 saniye boşta kalan bağlantıyı kapat (Supabase kapatmadan biz kapatalım)
  connectionTimeoutMillis: 5000, // Bağlantı kurmak 5 saniyeden uzun sürerse hata ver
});

// Beklenmedik hataları yakala (Uygulamanın çökmesini engeller)
pool.on('error', (err, client) => {
  console.error('❌ Veritabanı havuzunda beklenmedik hata:', err);
  // Kritik hata değilse süreci öldürme, sadece logla.
});

module.exports = pool;