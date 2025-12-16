const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');
// 👇 AŞAĞIDA VERDİĞİM YENİ MİDDLEWARE'İ BURAYA IMPORT ET
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware'); 

// Post İşlemleri
router.get('/posts', optionalAuthMiddleware, forumController.getAllPosts);
router.post('/posts', authMiddleware, forumController.createPost);
router.get('/posts/my-posts', authMiddleware, forumController.getMyPosts);

router.get('/zone/:zoneId', optionalAuthMiddleware, forumController.getPostsByZone);
router.get('/posts/:postId/comments', forumController.getComments);
router.post('/posts/:postId/comments', authMiddleware, forumController.addComment);
router.post('/posts/:id/like', authMiddleware, forumController.toggleLike); 

module.exports = router;