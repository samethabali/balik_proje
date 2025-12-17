// backend/controllers/rentalsController.js
const rentalsService = require('../services/rentalsService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.createBoatRental = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const { boatId, durationMinutes } = req.body;
    const rental = await rentalsService.createBoatRental({ userId, boatId, durationMinutes });
    res.status(201).json(rental);
});

exports.completeBoatRental = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;

    const { id } = req.params;
    const rentalId = parseInt(id, 10);
    if (Number.isNaN(rentalId)) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    const rental = await rentalsService.completeBoatRental({ userId, rentalId });
    res.json(rental);
});


exports.createEquipmentRental = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const { equipmentId, durationMinutes } = req.body;
    const rental = await rentalsService.createEquipmentRental({ userId, equipmentId, durationMinutes });
    res.status(201).json(rental);
});

exports.completeEquipmentRental = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;

    const { id } = req.params;
    const rentalId = parseInt(id, 10);
    if (Number.isNaN(rentalId)) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    const rental = await rentalsService.completeEquipmentRental({ userId, rentalId });
    res.json(rental);
});


exports.getMyActiveBoatRentals = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const rentals = await rentalsService.getMyActiveBoatRentals(userId);
    res.json(rentals);
});


exports.getMyActiveEquipmentRentals = asyncWrapper(async (req, res) => {
    console.log('[getMyActiveEquipmentRentals] req.user =', req.user); // ✅ debug
    const userId = req.user.user_id;
    console.log('[getMyActiveEquipmentRentals] userId =', userId);     // ✅ debug
    const rentals = await rentalsService.getMyActiveEquipmentRentals(userId);
    res.json(rentals);
});

exports.returnAllEquipment = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const result = await rentalsService.returnAllMyEquipment(userId);
    res.json(result);
});

// Admin: Tüm aktif kiralamaları getir
exports.getAllActiveRentals = asyncWrapper(async (req, res) => {
    const rentals = await rentalsService.getAllActiveRentals();
    res.json(rentals);
});

// Admin: Herhangi bir kiralamayı kapat
exports.closeRental = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { rentalType } = req.body; // 'boat' or 'equipment'

    const rentalId = parseInt(id, 10);
    if (Number.isNaN(rentalId)) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    if (!rentalType || !['boat', 'equipment'].includes(rentalType)) {
        return res.status(400).json({ error: 'Invalid rental type. Must be "boat" or "equipment"' });
    }

    const result = await rentalsService.closeRental({ rentalId, rentalType });
    res.json(result);
});

// Admin: Geçmiş kiralamaları getir
exports.getCompletedRentals = asyncWrapper(async (req, res) => {
    const { userName, startDate, endDate, rentalType } = req.query;

    const rentals = await rentalsService.getCompletedRentals({
        userName: userName || null,
        startDate: startDate || null,
        endDate: endDate || null,
        rentalType: rentalType || 'all'
    });

    res.json(rentals);
});

// Admin: Aylık kazancı getir
exports.getMonthlyRevenue = asyncWrapper(async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ error: 'year ve month parametreleri zorunlu' });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (Number.isNaN(yearNum) || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Geçersiz yıl veya ay değeri' });
    }

    const revenue = await rentalsService.getMonthlyRevenue({ year: yearNum, month: monthNum });
    res.json(revenue);
});

// Admin: Tekne ve Ekipman Gelir Analizi (Sorgu 5)
exports.getRevenueAnalysis = asyncWrapper(async (req, res) => {
    const { year, month } = req.query;
    
    let params = {};
    if (year && month) {
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (!Number.isNaN(yearNum) && !Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            params = { year: yearNum, month: monthNum };
        }
    }
    
    const analysis = await rentalsService.getRevenueAnalysis(params);
    res.json(analysis);
});
