// backend/controllers/boatsController.js
const boatsService = require('../services/boatsService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.getActiveBoats = asyncWrapper(async (req, res) => {
    const boats = await boatsService.getActiveBoats();
    res.json(boats);
});

//uygun tekneleri almak için kullanılacak.
exports.getAvailableBoats = asyncWrapper(async (req, res) => {
    const boats = await boatsService.getAvailableBoats();
    res.json(boats);
});

// Admin: Yeni tekne oluştur
exports.createBoat = asyncWrapper(async (req, res) => {
    const { name, capacity, price_per_hour, status } = req.body;
    
    if (!name || !capacity || !price_per_hour) {
        return res.status(400).json({ error: 'name, capacity ve price_per_hour zorunlu' });
    }
    
    const boat = await boatsService.createBoat({ name, capacity, price_per_hour, status });
    res.status(201).json(boat);
});

// Admin: Tekne güncelle
exports.updateBoat = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { name, capacity, price_per_hour, status } = req.body;
    
    const boatId = parseInt(id, 10);
    if (Number.isNaN(boatId)) {
        return res.status(400).json({ error: 'Invalid boat id' });
    }
    
    const boat = await boatsService.updateBoat({ boatId, name, capacity, price_per_hour, status });
    res.json(boat);
});

// Admin: Tekne sil (soft delete)
exports.deleteBoat = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    const boatId = parseInt(id, 10);
    if (Number.isNaN(boatId)) {
        return res.status(400).json({ error: 'Invalid boat id' });
    }
    
    const boat = await boatsService.deleteBoat(boatId);
    res.json(boat);
});
