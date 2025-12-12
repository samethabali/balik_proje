// backend/routes/rentalsRoutes.js
const express = require('express');
const router = express.Router();
const {
    createBoatRental,
    completeBoatRental,
    createEquipmentRental,
    completeEquipmentRental,
    getMyActiveEquipmentRentals,
    returnAllEquipment,
} = require('../controllers/rentalsController');

// Tekne kiralama başlat
router.post('/boat', createBoatRental);

// --- YENİ EKLENEN ROTA ---
// Kullanıcının üzerindeki ekipmanları getir
router.get('/equipment/my-active', getMyActiveEquipmentRentals); 

// Ekipman kiralama başlat
router.post('/equipment', createEquipmentRental);

router.get('/equipment/my-active', getMyActiveEquipmentRentals); 

// YENİ EKLENEN ROTA: Toplu İade
// (Controller'dan import etmeyi UNUTMA: returnAllEquipment)
router.post('/equipment/return-all', returnAllEquipment); 

router.post('/equipment', createEquipmentRental);

// Ekipman kiralamayı bitir
router.post('/equipment/:id/complete', completeEquipmentRental);

// Tekne kiralamayı bitir
router.post('/:id/complete', completeBoatRental);

module.exports = router;