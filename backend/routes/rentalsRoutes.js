// backend/routes/rentalsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const {
    createBoatRental,
    completeBoatRental,
    createEquipmentRental,
    completeEquipmentRental,
    getMyActiveBoatRentals,
    getMyActiveEquipmentRentals,
    returnAllEquipment,
    getAllActiveRentals,
    closeRental,
    getCompletedRentals,
    getMonthlyRevenue,
    getRevenueAnalysis,
} = require('../controllers/rentalsController');

// Tekne kiralama başlat
router.post('/boat', authMiddleware, createBoatRental);

// Kullanıcının aktif tekne kiralamalarını getir
router.get('/boat/my-active', authMiddleware, getMyActiveBoatRentals);

// --- YENİ EKLENEN ROTA ---
// Kullanıcının üzerindeki ekipmanları getir
router.get('/equipment/my-active', authMiddleware, getMyActiveEquipmentRentals);

// Ekipman kiralama başlat
router.post('/equipment', authMiddleware, createEquipmentRental);


// YENİ EKLENEN ROTA: Toplu İade
// (Controller'dan import etmeyi UNUTMA: returnAllEquipment)
router.post('/equipment/return-all', authMiddleware, returnAllEquipment);


// Ekipman kiralamayı bitir
router.post('/equipment/:id/complete', authMiddleware, completeEquipmentRental);

// Tekne kiralamayı bitir
router.post('/:id/complete', authMiddleware, completeBoatRental);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, getAllActiveRentals);
router.post('/admin/:id/close', authMiddleware, adminMiddleware, closeRental);
router.get('/admin/completed', authMiddleware, adminMiddleware, getCompletedRentals);
router.get('/admin/revenue', authMiddleware, adminMiddleware, getMonthlyRevenue);
router.get('/admin/revenue-analysis', authMiddleware, adminMiddleware, getRevenueAnalysis);

module.exports = router;