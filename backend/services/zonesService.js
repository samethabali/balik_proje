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