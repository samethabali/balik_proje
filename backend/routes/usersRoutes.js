// backend/routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Spesifik route'lar önce (/:userId/stats, /active)
router.get('/active', authMiddleware, adminMiddleware, usersController.getActiveUsers);
router.get('/stats/all', authMiddleware, adminMiddleware, usersController.getAllUsersStats);
router.get('/:userId/stats', authMiddleware, usersController.getUserStats);

// Genel route'lar sonra
router.get('/:userId', usersController.getUserInfo);

module.exports = router;

