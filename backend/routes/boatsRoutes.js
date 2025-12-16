// backend/routes/boatsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getActiveBoats, getAvailableBoats, createBoat, updateBoat, deleteBoat } = require('../controllers/boatsController');

// Spesifik route'lar önce (GET /active, /available)
router.get('/active', getActiveBoats);
router.get('/available', getAvailableBoats);

// Admin routes - genel route'lar sonra (POST /, PUT /:id, DELETE /:id)
router.post('/', authMiddleware, adminMiddleware, createBoat);
router.put('/:id', authMiddleware, adminMiddleware, updateBoat);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBoat);

module.exports = router;
