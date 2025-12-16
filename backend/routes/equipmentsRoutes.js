// backend/routes/equipmentsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAvailableEquipment, getEquipmentTypes, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentsController');

router.get('/available', getAvailableEquipment);
router.get('/types', getEquipmentTypes);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createEquipment);
router.put('/:id', authMiddleware, adminMiddleware, updateEquipment);
router.delete('/:id', authMiddleware, adminMiddleware, deleteEquipment);

module.exports = router;

