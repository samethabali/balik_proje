const pool = require('../config/db');

// Bölgeye göre etkinlikleri getir (geçmiş, güncel, gelecek olarak kategorize edilmiş)
exports.getActivitiesByZone = async (zoneId) => {
  const query = `
    SELECT 
      activity_id,
      zone_id,
      title,
      description,
      start_date,
      end_date,
      created_at
    FROM activities
    WHERE zone_id = $1
    ORDER BY start_date ASC
  `;

  const { rows } = await pool.query(query, [zoneId]);
  
  // Şu anki tarih
  const now = new Date();
  
  // Etkinlikleri kategorilere ayır
  const past = [];
  const current = [];
  const upcoming = [];
  
  rows.forEach(activity => {
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);
    
    // Geçmiş: bitiş tarihi şu andan önce
    if (endDate < now) {
      past.push(activity);
    }
    // Güncel: başlangıç tarihi şu andan önce veya eşit VE bitiş tarihi şu andan sonra
    else if (startDate <= now && endDate >= now) {
      current.push(activity);
    }
    // Gelecek: başlangıç tarihi şu andan sonra
    else {
      upcoming.push(activity);
    }
  });
  
  return {
    past,
    current,
    upcoming
  };
};

// Tüm etkinlikleri getir (opsiyonel, şimdilik kullanmayacağız)
exports.getAllActivities = async () => {
  const query = `
    SELECT 
      a.activity_id,
      a.zone_id,
      a.title,
      a.description,
      a.start_date,
      a.end_date,
      a.created_at,
      z.name as zone_name
    FROM activities a
    JOIN lake_zones z ON a.zone_id = z.zone_id
    ORDER BY a.start_date ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
};

// 🔹 Admin: Yeni etkinlik oluştur
exports.createActivity = async ({ zone_id, title, description, start_date, end_date }) => {
  const query = `
    INSERT INTO activities (zone_id, title, description, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING activity_id, zone_id, title, description, start_date, end_date, created_at;
  `;
  
  const { rows } = await pool.query(query, [zone_id, title, description || null, start_date, end_date]);
  return rows[0];
};

// 🔹 Admin: Etkinlik güncelle
exports.updateActivity = async ({ activityId, zone_id, title, description, start_date, end_date }) => {
  const query = `
    UPDATE activities
    SET zone_id = COALESCE($1, zone_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date)
    WHERE activity_id = $6
    RETURNING activity_id, zone_id, title, description, start_date, end_date, created_at;
  `;
  
  const { rows } = await pool.query(query, [zone_id, title, description, start_date, end_date, activityId]);
  
  if (rows.length === 0) {
    throw new Error('Etkinlik bulunamadı');
  }
  
  return rows[0];
};

// 🔹 Admin: Etkinlik sil
exports.deleteActivity = async (activityId) => {
  const query = `
    DELETE FROM activities
    WHERE activity_id = $1
    RETURNING activity_id, title;
  `;
  
  const { rows } = await pool.query(query, [activityId]);
  
  if (rows.length === 0) {
    throw new Error('Etkinlik bulunamadı');
  }
  
  return rows[0];
};

// Bölgeye göre gelecek aktiviteleri getir (Sorgu 7)
exports.getUpcomingActivitiesByZone = async (zoneId) => {
  const query = `
    SELECT 
      a.activity_id,
      a.title,
      a.description,
      a.start_date,
      a.end_date,
      lz.name AS zone_name
    FROM activities a
    JOIN lake_zones lz ON a.zone_id = lz.zone_id
    WHERE a.end_date > NOW() AND lz.zone_id = $1
    ORDER BY a.start_date ASC
  `;
  const { rows } = await pool.query(query, [zoneId]);
  return rows;
};

