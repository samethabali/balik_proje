const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// Ana Post İşlemleri
router.get('/posts', forumController.getAllPosts);
router.post('/posts', forumController.createPost);

// Zone ve Yorum İşlemleri
router.get('/zone/:zoneId', forumController.getPostsByZone);
router.get('/posts/:postId/comments', forumController.getComments);
router.post('/posts/:postId/comments', forumController.addComment);

module.exports = router;