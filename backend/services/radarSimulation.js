const pool = require("../config/db");


// AYARLAR
const SIMULATION_INTERVAL = 2000; // 1s'de bir çalışır
const MOVEMENT_STEP = 0.002;    // Tekne hızı (küçük adımlar = akıcı hareket)
const SONAR_RANGE = 0.02;       // Radar tarama alanı
const CLUSTER_DISTANCE = 0.2;  // 20 metre içindeki balıkları grupla
const DIRECTION_CHANGE_CHANCE = 0.3; // %30 şansla yön değiştir
const DIRECTION_CHANGE_AMOUNT = 0.3; // Yön değişikliği miktarı (radyan)
const FISH_DETECTION_INTERVAL = 10000; // Her 3 saniyede bir balık taraması yap
const FISH_DETECTION_CHANCE = 0.6; // %60 şansla balık bul

// --- YARDIMCI FONKSİYON: Balık Bulma (Zamana Bağlı) ---
async function performFishDetection() {
  const client = await pool.connect();
  try {
    // Aktif tekneleri bul
    const activeRentals = await client.query(`
      SELECT r.rental_id, r.boat_id, b.name, ST_X(b.current_geom) as lon, ST_Y(b.current_geom) as lat
      FROM rentals r
      JOIN boats b ON r.boat_id = b.boat_id
      WHERE r.status = 'ongoing'
        AND b.current_geom IS NOT NULL
    `);

    if (activeRentals.rows.length === 0) return;

    for (const rental of activeRentals.rows) {
      const { rental_id, boat_id, lon, lat, name } = rental;

      // Koordinat kontrolü
      if (!lon || !lat) continue;

      // Rastgele şansla balık bul
      if (Math.random() < FISH_DETECTION_CHANCE) {
        const signalStrength = Math.floor(Math.random() * 100) + 1;
        // Balığı tekneden daha uzaklara yerleştir (radar menzili içinde)
        // 0.001 = yaklaşık 100 metre, 0.005 = yaklaşık 500 metre
        const fishDistance = 0.001 + Math.random() * 0.004; // 100-500 metre arası
        const angle = Math.random() * 2 * Math.PI; // Rastgele açı
        const fishLon = lon + Math.cos(angle) * fishDistance;
        const fishLat = lat + Math.sin(angle) * fishDistance;

        await client.query(`
          INSERT INTO sonar_readings (rental_id, geom, signal_strength)
          SELECT 
            $1, 
            ST_SetSRID(ST_MakePoint($2, $3), 4326), 
            $4
          WHERE EXISTS (
            SELECT 1
            FROM lake_zones l
            WHERE l.name ILIKE '%Van Gölü%'  -- sadece göl polygonu
              AND ST_Contains(
                l.geom,
                ST_SetSRID(ST_MakePoint($2, $3), 4326)
              )
          )
        `, [rental_id, fishLon, fishLat, signalStrength]);

        console.log(`📡 Sinyal: ${name} balık buldu! (Güç: ${signalStrength})`);
      }
    }
  } catch (err) {
    console.error("Balık Tespit Hatası:", err);
  } finally {
    client.release();
  }
}

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

  // Her tekne için yön bilgisini sakla (boat_id -> direction açısı)
  const boatDirections = new Map();

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

        // 2. Tekne için yön bilgisini al veya oluştur
        if (!boatDirections.has(boat_id)) {
          // İlk kez görülen tekne için rastgele yön ata
          boatDirections.set(boat_id, Math.random() * 2 * Math.PI);
        }

        let direction = boatDirections.get(boat_id);

        // Yön değişikliği (küçük rastgele sapmalar)
        if (Math.random() < DIRECTION_CHANGE_CHANCE) {
          direction += (Math.random() - 0.5) * DIRECTION_CHANGE_AMOUNT;
          direction = direction % (2 * Math.PI); // 0-2π aralığında tut
          boatDirections.set(boat_id, direction);
        }

        // 3. Tekneyi yönüne göre hareket ettir (akıcı hareket)
        let newLon = lon + Math.cos(direction) * MOVEMENT_STEP;
        let newLat = lat + Math.sin(direction) * MOVEMENT_STEP;

        // 4. Tekneyi Hareket Ettir (Sadece göl içindeyse)
        const updateRes = await client.query(`
          UPDATE boats
          SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
          WHERE boat_id = $3
            AND EXISTS (
              SELECT 1
              FROM lake_zones l
              WHERE l.name ILIKE '%Van Gölü%'  -- sadece göl polygonu
                AND ST_Contains(
                  l.geom,
                  ST_SetSRID(ST_MakePoint($1, $2), 4326)
                )
            )
          RETURNING ST_X(current_geom) AS lon, ST_Y(current_geom) AS lat;
        `, [newLon, newLat, boat_id]);


        // Eğer göl dışına çıkmaya çalıştıysa, yönü değiştir ve hareketi iptal et
        if (updateRes.rowCount === 0) {
          // Göl sınırına çarptı, yönü tersine çevir
          direction = (direction + Math.PI) % (2 * Math.PI);
          boatDirections.set(boat_id, direction);
          // hareket yok, eski konumda kal
          newLon = lon;
          newLat = lat;
        } else {
          // güncel konumu güncelle
          lon = updateRes.rows[0].lon;
          lat = updateRes.rows[0].lat;
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

  // Balık bulma işlemini ayrı bir zamanlayıcı ile çalıştır (teknelerin hareketinden bağımsız)
  setInterval(async () => {
    await performFishDetection();
    // Balık bulma sonrası hotspot'ları güncelle
    const client = await pool.connect();
    try {
      await syncSonarToHotspots(client);
    } catch (err) {
      console.error("Hotspot Güncelleme Hatası:", err);
    } finally {
      client.release();
    }
  }, FISH_DETECTION_INTERVAL);
}

module.exports = { startSimulation };
