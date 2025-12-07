// backend/controllers/forumController.js
const pool = require('../config/db'); // db.js dosyanın yolu (senin projene göre '../db' veya '../config/db' olabilir)

// 1. Tüm Postları Getir
exports.getAllPosts = async (req, res) => {
  try {
    // Postları, yazan kişinin adını ve (varsa) zone ismini çekiyoruz
    const query = `
      SELECT p.post_id, p.title, p.content, p.created_at, p.visibility,
             u.full_name as author, 
             z.name as zone_name, z.zone_id
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Postlar çekilemedi' });
  }
};

// 2. Bölgeye Göre Post Getir (SENİN İÇİN EN ÖNEMLİ KISIM BURASI)
exports.getPostsByZone = async (req, res) => {
  const { zoneId } = req.params; // URL'deki :zoneId'yi alıyoruz
  try {
    const query = `
      SELECT p.post_id, p.title, p.content, p.created_at,
             u.full_name as author,
             z.name as zone_name
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
      WHERE p.zone_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [zoneId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bölge postları çekilemedi' });
  }
};

// 3. Post Oluştur
exports.createPost = async (req, res) => {
  const { user_id, title, content, zone_id, visibility } = req.body;
  try {
    const query = `
      INSERT INTO posts (user_id, title, content, zone_id, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [user_id, title, content, zone_id, visibility || 'public']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Post oluşturulamadı' });
  }
};

// 4. Yorumları Getir
exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const query = `
      SELECT c.comment_id, c.content, c.created_at,
             u.full_name as author
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, [postId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yorumlar çekilemedi' });
  }
};

// 5. Yorum Yap
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { user_id, content } = req.body;
  try {
    const query = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [postId, user_id, content]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yorum yapılamadı' });
  }
};