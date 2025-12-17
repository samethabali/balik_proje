// backend/controllers/forumController.js
const ForumService = require('../services/forumService');
const asyncWrapper = require('../middleware/asyncWrapper'); // Wrapper'ı ekledik

// 1. Tüm Postları Getir (Kullanıcı giriş yapmışsa like durumunu görsün)
exports.getAllPosts = async (req, res) => {
  try {
    // Kullanıcı giriş yapmışsa ID'sini al, yapmamışsa 0 gönder
    const currentUserId = req.user ? req.user.user_id : 0;
    
    // Servise bu ID'yi gönderiyoruz
    const posts = await ForumService.getAllPosts(currentUserId); 
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Bölgeye Göre Post Getir
exports.getPostsByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const currentUserId = req.user ? req.user.user_id : 0; // <--- Burası önemli
    
    const posts = await ForumService.getPostsByZone(zoneId, currentUserId);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Post Oluştur (Photo URL desteği ile)
exports.createPost = asyncWrapper(async (req, res) => {
  const userId = req.user.user_id;
  const { title, content, zone_id, visibility, photoUrl } = req.body; // photoUrl eklendi

  if (!title || !content) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });
  }

  const newPost = await ForumService.createPost({
    userId,
    title,
    content,
    zone_id: zone_id || null,
    visibility,
    photoUrl // Servise gönder
  });
  res.status(201).json(newPost);
});

// 4. Beğeni Yap / Geri Al (YENİ ENDPOINT)
exports.toggleLike = asyncWrapper(async (req, res) => {
  const userId = req.user.user_id;
  const { id } = req.params; // post id

  const result = await ForumService.toggleLike(userId, id);
  res.json(result); // { liked: true } veya { liked: false } döner
});

exports.getComments = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const comments = await ForumService.getComments(postId);
    res.json(comments);
});

exports.addComment = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.user_id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Yorum içeriği boş olamaz.' });
    }

    const newComment = await ForumService.addComment(postId, userId, content);
    res.status(201).json(newComment);
});

exports.getMyPosts = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const posts = await ForumService.getMyPosts(userId);
    res.json(posts);
});

// Kullanıcı forum istatistiklerini getir (Sorgu 4)
exports.getUserForumStats = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);

    if (Number.isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }

    try {
        const stats = await ForumService.getUserForumStats(userIdNum);
        res.json(stats);
    } catch (err) {
        return res.status(404).json({ error: err.message });
    }
});

// Tüm kullanıcıların forum istatistiklerini getir (Sorgu 4 - Admin)
exports.getAllUsersForumStats = asyncWrapper(async (req, res) => {
    const stats = await ForumService.getAllUsersForumStats();
    res.json(stats);
});