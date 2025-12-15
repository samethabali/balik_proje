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
    const userId = req.user.user_id;
    const rentals = await rentalsService.getMyActiveEquipmentRentals(userId);
    res.json(rentals);
});

exports.returnAllEquipment = asyncWrapper(async (req, res) => {
    const userId = req.user.user_id;
    const result = await rentalsService.returnAllMyEquipment(userId);
    res.json(result);
});
