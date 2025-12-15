const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');

// Ana Post İşlemleri
router.get('/posts', forumController.getAllPosts);
router.post('/posts', authMiddleware, forumController.createPost);
router.get('/posts/my-posts', authMiddleware, forumController.getMyPosts);

// Zone ve Yorum İşlemleri
router.get('/zone/:zoneId', forumController.getPostsByZone);
router.get('/posts/:postId/comments', forumController.getComments);
router.post('/posts/:postId/comments', authMiddleware, forumController.addComment);

module.exports = router;