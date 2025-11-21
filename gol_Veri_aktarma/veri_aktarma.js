const fs = require('fs');
const { Client } = require('pg');

// 1. JSON dosyasını oku (Dosya yolunun doğru olduğundan emin ol)
// Dosya ismin farklıysa burayı düzelt (örn: src/data/vanGoluVeBolgeler.json)
const rawData = fs.readFileSync('./vanGolu_simplified_10000.json'); 
const geojsonData = JSON.parse(rawData);

// 2. Veritabanı bağlantı ayarları
const client = new Client({
  user: 'emre',       // Kendi kullanıcı adın
  host: 'localhost',
  database: 'balik_proje', // Kendi veritabanı ismin
  password: 'güçlü_bir_şifre_buraya',     // Kendi şifren
  port: 5432,
});

async function seedData() {
  try {
    await client.connect();
    console.log('Veritabanına bağlanıldı...');

    // (İsteğe bağlı) Tabloyu önce temizle ki üst üste binmesin
    // await client.query('TRUNCATE TABLE lake_zones RESTART IDENTITY');

    // 3. Verileri Döngüye Al
    for (const feature of geojsonData.features) {
      const props = feature.properties;
      const geometry = feature.geometry;

      // Senin tablon: name, notes, geom
      // JSON verisi: properties.name, properties.description
      
      const name = props.name || 'Bilinmeyen Bölge';
      
      // JSON'daki 'description' veya 'type' verisini 'notes' sütununa koyalım
      // Eğer description yoksa type'ı yazsın.
      const notes = props.description || props.type || '';

      // Geometriyi JSON string'e çevir
      const geometryString = JSON.stringify(geometry);

      // 4. SQL INSERT Sorgusu
      // ST_GeomFromGeoJSON: JSON'ı geometriye çevirir.
      // ST_SetSRID: Koordinat sistemini 4326 (GPS) olarak ayarlar.
      const query = `
        INSERT INTO lake.lake_zones (name, notes, geom)
        VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))
      `;

      const values = [name, notes, geometryString];

      await client.query(query, values);
      console.log(`Eklendi: ${name}`);
    }

    console.log('--- TÜM VERİLER BAŞARIYLA EKLENDİ ---');

  } catch (err) {
    console.error('Hata Detayı:', err);
  } finally {
    await client.end();
  }
}

seedData();