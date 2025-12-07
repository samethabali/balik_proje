const pool = require("../config/db");


// AYARLAR
const SIMULATION_INTERVAL = 5000; // 5 saniyede bir çalışır
const MOVEMENT_STEP = 0.015;    // Tekne hızı (~15 metre)
const SONAR_RANGE = 0.02;       // Radar tarama alanı
const CLUSTER_DISTANCE = 0.02;  // 20 metre içindeki balıkları grupla

// --- YARDIMCI FONKSİYON: Sonar Verilerini Hotspot'a Dönüştür ---
async function syncSonarToHotspots(client) {
  try {
    // 1. Çok eski hotspot'ları veya teknelerden çok uzak olanları temizle
    //    - 15 saniyeden eski olanlar
    //    - VEYA hiçbir ongoing tekneye 60 metreden daha yakın olmayanlar
    await client.query(`
      DELETE FROM fish_hotspots h
      WHERE h.last_seen < NOW() - INTERVAL '30 seconds'
         OR NOT EXISTS (
            SELECT 1
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            WHERE r.status = 'ongoing'
              AND b.current_geom IS NOT NULL
              AND ST_DWithin(
                    h.geom::geography,
                    b.current_geom::geography,
                    60  -- metre cinsinden radar menzili
                  )
         );
    `);

    // 2. Son 10 saniyedeki sonar verilerini analiz et, grupla ve Hotspot tablosuna yaz
    const query = `
      INSERT INTO fish_hotspots (species_id, intensity, geom, last_seen, depth)
      SELECT 
        FLOOR(RANDOM() * 3 + 1)::int AS species_id,
        CEIL(AVG(signal_strength) / 10)        AS intensity,
        ST_Centroid(ST_Collect(geom))          AS geom,
        NOW()                                  AS last_seen,
        ROUND((RANDOM() * 20 + 2)::numeric, 1) AS depth
      FROM (
        SELECT 
          s.*,
          ST_ClusterDBSCAN(
            s.geom,
            $1::double precision,  -- eps (mesafe eşiği, ~0.0002 derece)
            1                      -- min points
          ) OVER () AS cid
        FROM sonar_readings s
        WHERE s.detected_at > NOW() - INTERVAL '10 seconds'
      ) sub
      GROUP BY cid;
    `;

    await client.query(query, [CLUSTER_DISTANCE]);
  } catch (err) {
    console.error("Hotspot Sync Hatası:", err);
  }
}


// --- ANA FONKSİYON: Simülasyonu Başlat ---
async function startSimulation() {
  console.log("🎣 Balık Radarı ve Tekne Simülasyonu Başlatıldı...");

  setInterval(async () => {
    const client = await pool.connect();
    try {
      // 1. Aktif Kiralamaları (Suda olan tekneleri) Bul
      const activeRentals = await client.query(`
        SELECT r.rental_id, r.boat_id, b.name, ST_X(b.current_geom) as lon, ST_Y(b.current_geom) as lat
        FROM rentals r
        JOIN boats b ON r.boat_id = b.boat_id
        WHERE r.status = 'ongoing'
      `);

      if (activeRentals.rows.length === 0) return; // Tekne yoksa bekleme

      for (const rental of activeRentals.rows) {
        let { rental_id, boat_id, lon, lat, name } = rental;

        // Koordinat yoksa başlangıç noktası ata (Örn: Göl ortası)
        if (!lon || !lat) { lon = 29.0; lat = 41.0; }

        // 2. Tekneyi Hareket Ettir (Random Walk)
        let newLon = lon + (Math.random() - 0.5) * MOVEMENT_STEP;
        let newLat = lat + (Math.random() - 0.5) * MOVEMENT_STEP;

        // 2. Tekneyi Hareket Ettir (Sadece göl içindeyse)
        const updateRes = await client.query(`
          UPDATE boats
          SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
          WHERE boat_id = $3
            AND EXISTS (
              SELECT 1
              FROM lake_zones l
              WHERE ST_Contains(
                l.geom,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
              )
            )
          RETURNING ST_X(current_geom) AS lon, ST_Y(current_geom) AS lat;
        `, [newLon, newLat, boat_id]);

        // Eğer göl dışına çıkmaya çalıştıysa, hareketi iptal et
        if (updateRes.rowCount === 0) {
          // hareket yok, eski konumda kal
          newLon = lon;
          newLat = lat;
        } else {
          // güncel konumu, sonar için de kullanalım
          lon = updateRes.rows[0].lon;
          lat = updateRes.rows[0].lat;
        }


        // 3. Radar Taraması (%40 şansla balık bulsun)
        if (Math.random() > 0.6) {
          const signalStrength = Math.floor(Math.random() * 100) + 1;
          // Balığı teknenin biraz yakınına koy
          const fishLon = lon + (Math.random() - 0.5) * 0.00001;
          const fishLat = lat + (Math.random() - 0.5) * 0.00001;

          await client.query(`
            INSERT INTO sonar_readings (rental_id, geom, signal_strength)
            SELECT 
              $1, 
              ST_SetSRID(ST_MakePoint($2, $3), 4326), 
              $4
            WHERE EXISTS (
              SELECT 1
              FROM lake_zones l
              WHERE ST_Contains(
                l.geom,
                ST_SetSRID(ST_MakePoint($2, $3), 4326)
              )
            )
          `, [rental_id, fishLon, fishLat, signalStrength]);

          console.log(`📡 Sinyal: ${name} balık buldu! (Güç: ${signalStrength})`);
        }
      }

      // 4. Tüm verileri işle ve Hotspot tablosunu güncelle
      await syncSonarToHotspots(client);

    } catch (err) {
      console.error("Simülasyon Döngü Hatası:", err);
    } finally {
      client.release();
    }
  }, SIMULATION_INTERVAL);
}

module.exports = { startSimulation };
