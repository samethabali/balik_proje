// backend/controllers/rentalsController.js
const rentalsService = require('../services/rentalsService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.createBoatRental = asyncWrapper(async (req, res) => {
    const { boatId, durationMinutes } = req.body;

    if (!boatId) {
        return res.status(400).json({ error: 'boatId is required' });
    }

    try {
        const rental = await rentalsService.createBoatRental({
            boatId,
            durationMinutes,
        });
        res.status(201).json(rental);
    } catch (err) {
        // Basit hata handling, ileride geliştirebiliriz
        return res.status(400).json({ error: err.message });
    }
});

exports.completeBoatRental = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const rentalId = parseInt(id, 10);

    if (Number.isNaN(rentalId)) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    try {
        const rental = await rentalsService.completeBoatRental(rentalId);
        res.json(rental);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

exports.createEquipmentRental = asyncWrapper(async (req, res) => {
    const { equipmentId, durationMinutes } = req.body;

    if (!equipmentId) {
        return res.status(400).json({ error: 'equipmentId is required' });
    }

    try {
        const rental = await rentalsService.createEquipmentRental({
            equipmentId,
            durationMinutes,
        });
        res.status(201).json(rental);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

exports.completeEquipmentRental = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const rentalId = parseInt(id, 10);

    if (Number.isNaN(rentalId)) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    try {
        const rental = await rentalsService.completeEquipmentRental(rentalId);
        res.json(rental);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

exports.getMyActiveEquipmentRentals = asyncWrapper(async (req, res) => {
    // NOT: Giriş sistemi gelince burası req.user.id olacak.
    // Şimdilik User 1 olarak sabitliyoruz.
    const HARDCODED_USER_ID = 1; 

    const rentals = await rentalsService.getMyActiveEquipmentRentals(HARDCODED_USER_ID);
    res.json(rentals);
});

exports.returnAllEquipment = asyncWrapper(async (req, res) => {
    // Giriş sistemi gelene kadar User 1 sabit
    const HARDCODED_USER_ID = 1;

    const result = await rentalsService.returnAllMyEquipment(HARDCODED_USER_ID);
    res.json(result);
});