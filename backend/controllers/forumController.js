// backend/controllers/forumController.js
const ForumService = require('../services/forumService'); // Artık Service'i çağırıyoruz

// 1. Tüm Postları Getir
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await ForumService.getAllPosts();
    res.json(posts);
  } catch (err) {
    // Hata yönetimini middleware'e bırakabilirsin veya burada loglayabilirsin
    console.error(err);
    res.status(500).json({ error: 'Postlar çekilemedi' });
  }
};

// 2. Bölgeye Göre Post Getir
exports.getPostsByZone = async (req, res, next) => {
  const { zoneId } = req.params;
  try {
    const posts = await ForumService.getPostsByZone(zoneId);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bölge postları çekilemedi' });
  }
};

// 3. Post Oluştur
exports.createPost = async (req, res, next) => {
  try {
    // req.body içindeki verileri Service'e gönderiyoruz
    const newPost = await ForumService.createPost(req.body);
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Post oluşturulamadı' });
  }
};

// 4. Yorumları Getir
exports.getComments = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const comments = await ForumService.getComments(postId);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yorumlar çekilemedi' });
  }
};

// 5. Yorum Yap
exports.addComment = async (req, res, next) => {
  const { postId } = req.params;
  const { user_id, content } = req.body;
  try {
    const newComment = await ForumService.addComment(postId, user_id, content);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yorum yapılamadı' });
  }
};