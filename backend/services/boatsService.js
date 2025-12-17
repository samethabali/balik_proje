// backend/services/boatsService.js
const pool = require('../config/db');

exports.getActiveBoats = async () => {
  const query = `
    SELECT
      r.rental_id,
      b.boat_id,
      b.name,
      b.capacity,
      b.status,
      ST_AsGeoJSON(b.current_geom) AS geometry
    FROM rentals r
    JOIN boats b ON r.boat_id = b.boat_id
    WHERE r.status = 'ongoing'
      AND b.current_geom IS NOT NULL;
  `;

  const { rows } = await pool.query(query);

  // Basit bir dizi döndürüyoruz
  return rows.map(row => ({
    rental_id: row.rental_id,
    boat_id: row.boat_id,
    name: row.name,
    capacity: row.capacity,
    status: row.status,
    geometry: JSON.parse(row.geometry)
  }));
};

// 🔹 Yeni: müsait tekneler (iskede bekleyenler)
exports.getAvailableBoats = async () => {
  const query = `
    SELECT
      boat_id,
      name,
      capacity,
      price_per_hour,
      status,
      ST_AsGeoJSON(current_geom) AS geometry
    FROM boats
    WHERE status = 'available'
    ORDER BY price_per_hour ASC;
  `;

  const { rows } = await pool.query(query);

  return rows.map(row => ({
    boat_id: row.boat_id,
    name: row.name,
    capacity: row.capacity,
    price_per_hour: row.price_per_hour,
    status: row.status,
    geometry: row.geometry ? JSON.parse(row.geometry) : null
  }));
};

// 🔹 Admin: Yeni tekne oluştur
exports.createBoat = async ({ name, capacity, price_per_hour, status = 'available' }) => {
  const DOCK_LON = 42.90;
  const DOCK_LAT = 38.60;
  
  // Veri tiplerini garanti et
  const capacityNum = parseInt(capacity, 10);
  const priceNum = parseFloat(price_per_hour);
  
  // Status kontrolü
  const validStatuses = ['available', 'rented', 'maintenance'];
  const boatStatus = validStatuses.includes(status) ? status : 'available';
  
  if (Number.isNaN(capacityNum) || capacityNum <= 0) {
    throw new Error('Kapasite geçerli bir pozitif sayı olmalıdır');
  }
  
  if (Number.isNaN(priceNum) || priceNum <= 0) {
    throw new Error('Saatlik fiyat geçerli bir pozitif sayı olmalıdır');
  }
  
  try {
    console.log('🔍 Tekne oluşturma isteği:', { name, capacity: capacityNum, price_per_hour: priceNum, status: boatStatus });
    
    const query = `
      INSERT INTO boats (name, capacity, price_per_hour, status, current_geom)
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
      RETURNING boat_id, name, capacity, price_per_hour, status;
    `;
    
    const { rows } = await pool.query(query, [name, capacityNum, priceNum, boatStatus, DOCK_LON, DOCK_LAT]);
    
    if (rows.length === 0) {
      throw new Error('Tekne oluşturulamadı');
    }
    
    console.log('✅ Tekne başarıyla oluşturuldu:', rows[0]);
    return rows[0];
  } catch (err) {
    console.error('❌ Tekne oluşturma hatası:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    // Veritabanı hatalarını daha anlaşılır hale getir
    if (err.code === '23505') { // Unique constraint violation
      throw new Error('Bu isimde bir tekne zaten mevcut');
    } else if (err.code === '23502') { // Not null violation
      throw new Error('Gerekli alanlar eksik');
    } else if (err.code === '42P01') { // Table doesn't exist
      throw new Error('Boats tablosu bulunamadı. Veritabanı şemasını kontrol edin.');
    } else if (err.code === '42703') { // Column doesn't exist
      throw new Error('Boats tablosunda gerekli kolonlar bulunamadı. Veritabanı şemasını kontrol edin.');
    }
    // Orijinal hata mesajını kullan
    throw new Error(err.message || 'Tekne oluşturulurken bir hata oluştu');
  }
};

// 🔹 Admin: Tekne güncelle
exports.updateBoat = async ({ boatId, name, capacity, price_per_hour, status }) => {
  // Status kontrolü
  const validStatuses = ['available', 'rented', 'maintenance'];
  const boatStatus = status && validStatuses.includes(status) ? status : null;
  
  const query = `
    UPDATE boats
    SET name = COALESCE($1, name),
        capacity = COALESCE($2, capacity),
        price_per_hour = COALESCE($3, price_per_hour),
        status = COALESCE($4, status)
    WHERE boat_id = $5
    RETURNING boat_id, name, capacity, price_per_hour, status;
  `;
  
  const { rows } = await pool.query(query, [name, capacity, price_per_hour, boatStatus, boatId]);
  
  if (rows.length === 0) {
    throw new Error('Tekne bulunamadı');
  }
  
  return rows[0];
};

// 🔹 Admin: Tekne sil (soft delete - status='maintenance')
exports.deleteBoat = async (boatId) => {
  const query = `
    UPDATE boats
    SET status = 'maintenance'
    WHERE boat_id = $1
    RETURNING boat_id, name, status;
  `;
  
  const { rows } = await pool.query(query, [boatId]);
  
  if (rows.length === 0) {
    throw new Error('Tekne bulunamadı');
  }
  
  return rows[0];
};
