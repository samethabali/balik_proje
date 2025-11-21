// backend/server.js
const express = require('express');
const { Client } = require('pg');
const cors = require('cors'); // Frontend'in Backend'e erişmesine izin verir

const app = express();
const port = 3000;

// Güvenlik izni (React 5173 portundan, bu 3000 portuna erişebilsin diye)
app.use(cors());
app.use(express.json());

// Veritabanı Ayarları (Şifreni doğru yazdığından emin ol)
const client = new Client({
  user: 'emre',
  host: 'localhost',
  database: 'balik_proje', // Senin DB ismin
  password: 'emre123',        // Senin DB şifren
  port: 5432,
});

client.connect()
  .then(() => console.log('Veritabanına bağlanıldı'))
  .catch(err => console.error('Bağlantı hatası', err.stack));

// --- API ENDPOINT ---
// React bu adrese istek atacak: http://localhost:3000/api/zones
// Veritabanı bağlantı testi
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW() AS now');
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
app.get('/api/zones', async (req, res) => {
  try {
    // PostGIS fonksiyonu ile veriyi doğrudan GeoJSON formatına çeviriyoruz
    const query = `
      SELECT 
        zone_id, 
        name, 
        notes, 
        ST_AsGeoJSON(geom) as geometry 
      FROM lake.lake_zones
    `;
    
    const result = await client.query(query);

    // Leaflet'in sevdiği "FeatureCollection" formatına dönüştürme
    const features = result.rows.map(row => ({
      type: "Feature",
      properties: {
        id: row.zone_id,
        name: row.name,
        description: row.notes,
        // Basit bir renklendirme mantığı (İstersen geliştirebiliriz)
        type: row.name.includes('Gölü') ? 'lake' : 'zone'
      },
      geometry: JSON.parse(row.geometry) // String gelen veriyi JSON objesine çevir
    }));

    res.json({
      type: "FeatureCollection",
      features: features
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
});

app.listen(port, () => {
  console.log(`Backend sunucusu çalışıyor: http://localhost:${port}`);
});