// backend/services/forumService.js
const pool = require('../config/db'); // Veritabanı bağlantısı

class ForumService {

  // 1. Tüm Postları Çek
  // 1. Tüm Postları Çek (Beğeni ve Fotoğraflarla Birlikte) 🔥 GÜNCELLENDİ
  static async getAllPosts(currentUserId) {
    const query = `
      SELECT 
        p.post_id, p.title, p.content, p.created_at, p.visibility,
        u.full_name as author, 
        z.name as zone_name, z.zone_id,
        (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.post_id) as like_count,
        (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.post_id AND l.user_id = $1)) as is_liked,
        COALESCE(
          (SELECT JSON_AGG(ph.url) FROM post_photos ph WHERE ph.post_id = p.post_id),
          '[]'::json
        ) as photos
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query, [currentUserId || 0]);
    return rows;
  }

  // 2. Bölgeye Göre Post Çek
  static async getPostsByZone(zoneId, currentUserId) {
    const query = `
      SELECT 
        p.post_id, p.title, p.content, p.created_at,
        u.full_name as author,
        z.name as zone_name,
        (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.post_id) as like_count,
        (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.post_id AND l.user_id = $1)) as is_liked,
        COALESCE(
          (SELECT JSON_AGG(ph.url) FROM post_photos ph WHERE ph.post_id = p.post_id),
          '[]'::json
        ) as photos
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
      WHERE p.zone_id = $2
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query, [currentUserId || 0, zoneId]);
    return rows;
  }

  // 3. Post Oluştur (Fotoğraf Destekli) 🔥 GÜNCELLENDİ
  static async createPost({ userId, title, content, zone_id, visibility, photoUrl }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Postu kaydet
      const postQuery = `
        INSERT INTO posts (user_id, title, content, zone_id, visibility)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING post_id, title, content, created_at
      `;
      const postRes = await client.query(postQuery, [userId, title, content, zone_id, visibility || 'public']);
      const newPost = postRes.rows[0];

      // Fotoğraf varsa kaydet
      if (photoUrl && photoUrl.trim() !== '') {
        await client.query(
          `INSERT INTO post_photos (post_id, url) VALUES ($1, $2)`,
          [newPost.post_id, photoUrl]
        );
      }

      await client.query('COMMIT');
      return newPost;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }


  // 4. Beğeni İşlemi (Toggle: Varsa siler, yoksa ekler) 🔥 YENİ
  static async toggleLike(userId, postId) {
    const checkQuery = `SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2`;
    const checkRes = await pool.query(checkQuery, [userId, postId]);

    if (checkRes.rowCount > 0) {
      // Zaten beğenmiş -> Sil (Unlike)
      await pool.query(`DELETE FROM likes WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
      return { liked: false };
    } else {
      // Beğenmemiş -> Ekle (Like)
      await pool.query(`INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      return { liked: true };
    }
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

  // 6. Kullanıcının kendi postlarını getir
  static async getMyPosts(userId) {
  const query = `
    SELECT 
      p.post_id, p.title, p.content, p.created_at, p.visibility,
      u.full_name as author,
      z.name as zone_name, z.zone_id,
      (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.post_id) as like_count,
      -- 👇 EKLENEN KISIM: Fotoğrafları çekmek için
      COALESCE(
        (SELECT JSON_AGG(ph.url) FROM post_photos ph WHERE ph.post_id = p.post_id),
        '[]'::json
      ) as photos
    FROM posts p
    JOIN users u ON p.user_id = u.user_id
    LEFT JOIN lake_zones z ON p.zone_id = z.zone_id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}
}

module.exports = ForumService;