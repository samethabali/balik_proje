// 1. Gerekli Paketleri Yükle
require('dotenv').config(); // .env dosyasındaki şifreleri okur
const express = require('express');
const cors = require('cors');

// 2. Kendi Yazdığımız Dosyaları Çağır (Import)
const pool = require('./config/db'); // Veritabanı bağlantısı
const zonesRoutes = require('./routes/zonesRoutes');
const hotspotsRoutes = require('./routes/hotspotsRoutes');

// Middleware'ler (Ara Yazılımlar)
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// 3. Express Uygulamasını Başlat
const app = express();
const PORT = process.env.PORT || 3000;

// --- AYARLAR VE MIDDLEWARE ---

// CORS: Frontend'in (React - 5173) Backend'e (3000) erişmesine izin ver
app.use(cors());

// JSON: Gelen isteklerin içindeki JSON verisini okumamızı sağlar
app.use(express.json());

// Logger: Her isteği konsola yaz (Hata ayıklamak için süperdir)
// Eğer requestLogger dosyasını henüz oluşturmadıysan bu satırı yoruma alabilirsin
app.use(requestLogger);


// --- ROTALAR (ROUTES) ---
// Trafik polisi gibi: "zones ile ilgili istek gelirse zonesRoutes'a git"
app.use('/api/zones', zonesRoutes);
app.use('/api/hotspots', hotspotsRoutes);

// Sağlık Kontrolü (Health Check) - Tarayıcıdan http://localhost:3000 yazınca bu çıkar
app.get('/', (req, res) => {
  res.send('🎣 Balıkçılık Sistemi API Aktif ve Yüzüyor!');
});


// --- HATA YÖNETİMİ (En Sonda Olmalı) ---
// Eğer yukarıdaki kodlarda bir hata patlarsa burası yakalar ve sunucu çökmez
app.use(errorHandler);


// --- SUNUCUYU ATEŞLE ---
app.listen(PORT, async () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor: http://localhost:${PORT}`);

  // Başlarken veritabanı bağlantısını test et (Hocanın gözüne girmek için ekstra detay)
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ Veritabanı Bağlantısı Başarılı! (Sunucu Saati: ${res.rows[0].now})`);
  } catch (err) {
    console.error('❌ Veritabanı Bağlantı Hatası:', err.message);
  }
});