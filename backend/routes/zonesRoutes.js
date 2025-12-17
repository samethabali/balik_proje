const express = require('express');
const router = express.Router();
const { getZones, getZoneStats, getAllZonesStats } = require('../controllers/zonesController');

// Spesifik route'lar önce
router.get('/stats/all', getAllZonesStats);
router.get('/:zoneId/stats', getZoneStats);

// Genel route'lar sonra
router.get('/', getZones);

module.exports = router;
