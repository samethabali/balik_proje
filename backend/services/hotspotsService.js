const pool = require('../config/db');

exports.getHotspots = async () => {
  const query = `SELECT * FROM fish_hotspots ORDER BY created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
};

exports.createHotspot = async (data) => {
  const { name, fish_type, lat, lng, depth } = data;
  
  // SQL Injection koruması için $1, $2 parametrelerini kullanıyoruz
  const query = `
    INSERT INTO fish_hotspots (name, fish_type, lat, lng, depth)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [name, fish_type, lat, lng, depth];
  const { rows } = await pool.query(query, values);
  return rows[0];
};
/*
exports.deleteHotspot = async (id) => {
  const query = `DELETE FROM fish_hotspots WHERE id = $1 RETURNING *`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

exports.updateHotspot = async (id, data) => {
  const { name, fish_type, lat, lng, depth } = data;
  const query = `
    UPDATE fish_hotspots
    SET name = $1, fish_type = $2, lat = $3, lng = $4, depth = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING *
  `;
  const values = [name, fish_type, lat, lng, depth, id];
  const { rows } = await pool.query
(query, values);
  return rows[0];
};    */
