const pool = require('../config/db');

exports.getGeoJsonZones = async () => {
  // PostGIS fonksiyonu ST_AsGeoJSON'u doğrudan SQL içinde kullanıyoruz.
  const query = `
    SELECT 
      zone_id,
      name,
      notes,
      ST_AsGeoJSON(geom) as geometry
    FROM lake_zones
  `;

  const { rows } = await pool.query(query);

  // Veritabanından gelen satırları Frontend'in istediği GeoJSON formatına
  // Javascript tarafında çeviriyoruz.
  const features = rows.map(row => ({
    type: "Feature",
    properties: {
      id: row.zone_id,
      name: row.name,
      description: row.notes,
      type: row.type || 'unknown'
    },
    geometry: JSON.parse(row.geometry) // String gelen geometriyi JSON yap
  }));

  return {
    type: "FeatureCollection",
    features: features
  };
};

// Bölge istatistiklerini getir (Sorgu 2)
exports.getZoneStats = async (zoneId) => {
  const query = `
    SELECT 
      lz.zone_id,
      lz.name AS zone_name,
      COUNT(DISTINCT a.activity_id) AS activity_count,
      COUNT(DISTINCT p.post_id) AS post_count,
      AVG(EXTRACT(EPOCH FROM (a.end_date - a.start_date)) / 3600) AS avg_activity_duration_hours,
      MIN(a.start_date) AS earliest_activity,
      MAX(a.end_date) AS latest_activity
    FROM lake_zones lz
    LEFT JOIN activities a ON lz.zone_id = a.zone_id
    LEFT JOIN posts p ON lz.zone_id = p.zone_id
    WHERE lz.zone_id = $1
    GROUP BY lz.zone_id, lz.name
  `;
  const { rows } = await pool.query(query, [zoneId]);
  if (rows.length === 0) {
    throw new Error('Bölge bulunamadı');
  }
  return rows[0];
};

// Tüm bölgelerin istatistiklerini getir (Sorgu 2)
exports.getAllZonesStats = async () => {
  const query = `
    SELECT 
      lz.zone_id,
      lz.name AS zone_name,
      COUNT(DISTINCT a.activity_id) AS activity_count,
      COUNT(DISTINCT p.post_id) AS post_count,
      AVG(EXTRACT(EPOCH FROM (a.end_date - a.start_date)) / 3600) AS avg_activity_duration_hours,
      MIN(a.start_date) AS earliest_activity,
      MAX(a.end_date) AS latest_activity
    FROM lake_zones lz
    LEFT JOIN activities a ON lz.zone_id = a.zone_id
    LEFT JOIN posts p ON lz.zone_id = p.zone_id
    GROUP BY lz.zone_id, lz.name
    HAVING 
      COUNT(DISTINCT a.activity_id) > 0 OR COUNT(DISTINCT p.post_id) > 0
    ORDER BY activity_count DESC, post_count DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};