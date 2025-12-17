const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getActivitiesByZone, getAllActivities, createActivity, updateActivity, deleteActivity, getUpcomingActivitiesByZone } = require('../controllers/activitiesController');

// Spesifik route'lar önce
router.get('/zone/:zoneId/upcoming', getUpcomingActivitiesByZone);
router.get('/zone/:zoneId', getActivitiesByZone);
router.get('/', getAllActivities);

// Admin routes - genel route'lar sonra
router.post('/', authMiddleware, adminMiddleware, createActivity);
router.put('/:id', authMiddleware, adminMiddleware, updateActivity);
router.delete('/:id', authMiddleware, adminMiddleware, deleteActivity);

module.exports = router;

