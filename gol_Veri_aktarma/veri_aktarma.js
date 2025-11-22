// seed-lakezones.js

const fs = require('fs');
const { Client } = require('pg');

// 1) JSON dosyasını oku
const rawData = fs.readFileSync('./vanGolu_simplified_10000.json', 'utf8');
const geojsonData = JSON.parse(rawData);

// 2) Supabase PostgreSQL bağlantısı
// Supabase panel → Project Settings → Database → "Connection String → Node.js"
const client = new Client({
  connectionString: "SUPABASE_CONNECTİONSTRİNG",
  ssl: { rejectUnauthorized: false } 
});

async function seedData() {
  try {
    await client.connect();
    console.log("Supabase Postgres'e bağlandı.");

    // (Opsiyonel) eski datayı temizlemek için:
    // await client.query('TRUNCATE TABLE lake_zones RESTART IDENTITY');

    // 3) Feature'ları döngüye al
    for (const feature of geojsonData.features) {
      const name = feature.properties?.name || "Bilinmeyen Bölge";
      const notes = feature.properties?.description || feature.properties?.type || "";
      const geometryJson = JSON.stringify(feature.geometry);

      const query = `
        INSERT INTO lake_zones (name, notes, geom)
        VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))
      `;

      await client.query(query, [name, notes, geometryJson]);
      console.log(`Eklendi → ${name}`);
    }

    console.log("--- TÜM POLYGONLAR BAŞARIYLA EKLENDİ ---");

  } catch (err) {
    console.error("Hata oluştu:", err);
  } finally {
    await client.end();
  }
}

seedData();
