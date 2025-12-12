// backend/services/forumService.js
const pool = require('../config/db'); // Veritabanı bağlantısı

class ForumService {
  
  // 1. Tüm Postları Çek
  static async getAllPosts() {
    const query = `
      SELECT p.post_id, p.title, p.content, p.created_at, p.visibility,
             u.full_name as author, 
             z.name as zone_name, z.zone_id
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 2. Bölgeye Göre Post Çek
  static async getPostsByZone(zoneId) {
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
    const { rows } = await pool.query(query, [zoneId]);
    return rows;
  }

  // 3. Post Oluştur
  static async createPost(data) {
    const { user_id, title, content, zone_id, visibility } = data;
    const query = `
      INSERT INTO posts (user_id, title, content, zone_id, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    // Varsayılan olarak 'public' atıyoruz
    const { rows } = await pool.query(query, [user_id, title, content, zone_id, visibility || 'public']);
    return rows[0];
  }

  // 4. Yorumları Getir
  static async getComments(postId) {
    const query = `
      SELECT c.comment_id, c.content, c.created_at,
             u.full_name as author
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;
    const { rows } = await pool.query(query, [postId]);
    return rows;
  }

  // 5. Yorum Ekle
  static async addComment(postId, userId, content) {
    const query = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [postId, userId, content]);
    return rows[0];
  }
}

module.exports = ForumService;